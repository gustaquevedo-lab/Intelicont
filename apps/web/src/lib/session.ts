/**
 * session.ts — Native Railway PostgreSQL Session Management
 *
 * Replaces Supabase Auth completely. Uses:
 * - bcryptjs   → password hashing
 * - jose       → JWT signing (for stateless token inside cookie)
 * - PostgreSQL → persistent sessions table (source of truth)
 * - HTTP-only cookie → intelicont_session
 */

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { getDb } from "@ledger/db/index";
import { users, sessions, memberships, entities } from "@ledger/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { redis } from "./redis";

// ─── Constants ────────────────────────────────────────────────────────────

const SESSION_COOKIE = "intelicont_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days in seconds
const JWT_ALGORITHM = "HS256";

function getJwtSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET environment variable is not set");
  }
  return new TextEncoder().encode(secret);
}

// ─── Types ────────────────────────────────────────────────────────────────

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  emailVerified: boolean;
}

export interface SessionData {
  sessionId: string;
  user: SessionUser;
  activeEntityId: string | null;
  expiresAt: Date;
}

export interface UserWithMemberships extends SessionUser {
  memberships: {
    membershipId: string;
    entityId: string;
    role: string;
    ruc: string;
    legalName: string;
    tradeName: string | null;
  }[];
}

// ─── Session Creation ──────────────────────────────────────────────────────

/**
 * Creates a new database session and sets the HTTP-only cookie.
 * Called after successful login (magic link verify or password).
 */
export async function createSession(
  userId: string,
  options?: { activeEntityId?: string; userAgent?: string; ipAddress?: string }
): Promise<void> {
  const db = getDb();

  // Generate a random session token
  const tokenBytes = new Uint8Array(32);
  crypto.getRandomValues(tokenBytes);
  const sessionToken = Buffer.from(tokenBytes).toString("hex");

  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000);

  // Persist session in PostgreSQL
  const [session] = await db
    .insert(sessions)
    .values({
      userId,
      token: sessionToken,
      activeEntityId: options?.activeEntityId ?? null,
      userAgent: options?.userAgent ?? null,
      ipAddress: options?.ipAddress ?? null,
      expiresAt,
    })
    .returning({ id: sessions.id });

  // Sign a JWT containing only the session token (not user data)
  const jwt = await new SignJWT({ sessionToken, sid: session.id })
    .setProtectedHeader({ alg: JWT_ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(getJwtSecret());

  // Set HTTP-only, Secure, SameSite=Lax cookie
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
}

// ─── Session Validation ────────────────────────────────────────────────────

/**
 * Validates the session cookie and returns session data.
 * Returns null if invalid, expired, or not found.
 */
export async function getSession(): Promise<SessionData | null> {
  try {
    const cookieStore = await cookies();
    const jwt = cookieStore.get(SESSION_COOKIE)?.value;
    if (!jwt) return null;

    // Verify JWT signature and expiry
    const { payload } = await jwtVerify(jwt, getJwtSecret());
    const sessionToken = payload.sessionToken as string;
    if (!sessionToken) return null;

    // Try Redis cache first
    const cacheKey = `session:${sessionToken}`;
    const cachedSession = await redis.get(cacheKey).catch(() => null);
    if (cachedSession) {
      try {
        const parsed = JSON.parse(cachedSession);
        parsed.expiresAt = new Date(parsed.expiresAt);
        return parsed;
      } catch (err) {
        console.error("Failed to parse cached session:", err);
      }
    }

    // Look up session + user in PostgreSQL
    const db = getDb();
    const [row] = await db
      .select({
        sessionId: sessions.id,
        sessionToken: sessions.token,
        activeEntityId: sessions.activeEntityId,
        expiresAt: sessions.expiresAt,
        userId: users.id,
        email: users.email,
        name: users.name,
        avatarUrl: users.avatarUrl,
        emailVerified: users.emailVerified,
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(
        and(
          eq(sessions.token, sessionToken),
          gt(sessions.expiresAt, new Date())
        )
      );

    if (!row) return null;

    const sessionData: SessionData = {
      sessionId: row.sessionId,
      user: {
        id: row.userId,
        email: row.email,
        name: row.name,
        avatarUrl: row.avatarUrl,
        emailVerified: row.emailVerified,
      },
      activeEntityId: row.activeEntityId,
      expiresAt: row.expiresAt,
    };

    // Cache in Redis
    const ttlSeconds = Math.max(1, Math.floor((new Date(row.expiresAt).getTime() - Date.now()) / 1000));
    await redis.set(cacheKey, JSON.stringify(sessionData), "EX", ttlSeconds).catch(() => null);

    return sessionData;
  } catch {
    return null;
  }
}

/**
 * Returns session or throws redirect to /login.
 * Use this in Server Components and Server Actions that require auth.
 */
export async function requireSession(): Promise<SessionData> {
  const session = await getSession();
  if (!session) {
    const { redirect } = await import("next/navigation");
    redirect("/login");
    throw new Error("Redirecting to login");
  }
  return session;
}

// ─── Session Destruction ───────────────────────────────────────────────────

export async function destroySession(): Promise<void> {
  try {
    const cookieStore = await cookies();
    const jwt = cookieStore.get(SESSION_COOKIE)?.value;

    if (jwt) {
      const { payload } = await jwtVerify(jwt, getJwtSecret()).catch(() => ({ payload: null }));
      if (payload) {
        const sessionToken = (payload as any).sessionToken as string;
        if (sessionToken) {
          const db = getDb();
          await db.delete(sessions).where(eq(sessions.token, sessionToken));
          await redis.del(`session:${sessionToken}`).catch(() => null);
        }
      }
    }
  } catch {
    // Ignore errors during logout
  } finally {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE);
  }
}

// ─── User + Memberships Loader ─────────────────────────────────────────────

/**
 * Returns the current user with their entity memberships.
 * Used in dashboard layouts and server actions.
 */
export async function getCurrentUserWithMemberships(): Promise<UserWithMemberships | null> {
  const session = await getSession();
  if (!session) return null;

  const db = getDb();
  const rows = await db
    .select({
      membershipId: memberships.id,
      entityId: memberships.entityId,
      role: memberships.role,
      ruc: entities.ruc,
      legalName: entities.legalName,
      tradeName: entities.tradeName,
    })
    .from(memberships)
    .innerJoin(entities, eq(memberships.entityId, entities.id))
    .where(eq(memberships.userId, session.user.id));

  return {
    ...session.user,
    memberships: rows.map((r) => ({
      membershipId: r.membershipId,
      entityId: r.entityId,
      role: r.role as string,
      ruc: r.ruc,
      legalName: r.legalName,
      tradeName: r.tradeName,
    })),
  };
}

// ─── Active Entity Updater ─────────────────────────────────────────────────

export async function setActiveEntity(entityId: string): Promise<void> {
  try {
    const cookieStore = await cookies();
    const jwt = cookieStore.get(SESSION_COOKIE)?.value;
    if (!jwt) return;

    const { payload } = await jwtVerify(jwt, getJwtSecret()).catch(() => ({ payload: null }));
    if (!payload) return;

    const sessionToken = (payload as any).sessionToken as string;
    if (!sessionToken) return;

    const db = getDb();
    await db
      .update(sessions)
      .set({ activeEntityId: entityId })
      .where(eq(sessions.token, sessionToken));

    // Invalidate Redis cache
    await redis.del(`session:${sessionToken}`).catch(() => null);

    // Also set cookie for middleware reading
    cookieStore.set("active_entity_id", entityId, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE,
      path: "/",
    });
  } catch {
    // Ignore
  }
}
