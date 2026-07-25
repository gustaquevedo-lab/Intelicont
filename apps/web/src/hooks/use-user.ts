"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  emailVerified: boolean;
}

/**
 * useUser — Client-side hook to get the current authenticated user.
 *
 * Migrated from Supabase Auth to native Railway PostgreSQL sessions.
 * Fetches from the /api/auth/me endpoint which reads the HTTP-only session cookie.
 *
 * Usage:
 *   const { user, isLoading } = useUser();
 */
export function useUser() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const fetchUser = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
      });

      if (response.status === 401) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      if (!response.ok) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      setUser(data.user ?? null);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const signOut = useCallback(async () => {
    try {
      await fetch("/api/auth/signout", { method: "POST", credentials: "include" });
    } finally {
      setUser(null);
      router.push("/login");
    }
  }, [router]);

  return { user, isLoading, signOut, refetch: fetchUser };
}
