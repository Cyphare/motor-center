"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/hooks/use-auth";
import { homeForRole } from "@/lib/roles";

/**
 * Redirects an already-authenticated visitor away from public-only pages
 * (login, register) to their role home. Returns whether a redirect is pending
 * so the page can render a loading state instead of the form.
 */
export function useRedirectAuthenticated(): { redirecting: boolean } {
  const router = useRouter();
  const { user, isHydrated } = useAuth();
  const redirecting = isHydrated && Boolean(user);

  React.useEffect(() => {
    if (isHydrated && user) {
      router.replace(homeForRole(user.role));
    }
  }, [isHydrated, user, router]);

  return { redirecting };
}
