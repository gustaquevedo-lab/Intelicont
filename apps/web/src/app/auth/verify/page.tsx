import { redirect } from "next/navigation";
import { verifyMagicLink } from "@/lib/auth";

interface Props {
  searchParams: Promise<{ token?: string; email?: string; redirectTo?: string }>;
}

/**
 * GET /auth/verify?token=XXX&email=YYY
 *
 * Verifies a magic link token. On success, creates a session and
 * redirects to the dashboard (or the original requested URL).
 * On failure, redirects to /login with an error query param.
 */
export default async function VerifyMagicLinkPage({ searchParams }: Props) {
  const params = await searchParams;
  const { token, email, redirectTo = "/" } = params;

  if (!token || !email) {
    redirect("/login?error=invalid_link");
  }

  const result = await verifyMagicLink(token, email);

  if (!result.success) {
    redirect(`/login?error=${encodeURIComponent(result.error ?? "invalid_token")}`);
  }

  redirect(redirectTo);
}
