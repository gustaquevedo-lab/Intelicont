"use client";

import { useCurrentUser } from "@/lib/auth-store";

export function useUser() {
  const { user, logout } = useCurrentUser();
  return {
    user: user ? { ...user, emailVerified: true, avatarUrl: null } : null,
    isLoading: false,
    signOut: logout,
  };
}
