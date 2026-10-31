"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import type { UserRole } from "@/types/api";
import { useAuth } from "@/hooks/use-auth";
import { decideGuard } from "@/lib/guard-decision";
import { LoadingState } from "@/components/loading-state";

export interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}

/**
 * Client-side area guard: redirects unauthenticated users to /login and
 * wrong-role users to their own home. Renders a loading state until the auth
 * session is hydrated and the decision is made.
 */
export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const router = useRouter();
  const { role, isHydrated } = useAuthRole();

  const decision = decideGuard({ isHydrated, role, allowedRoles });

  React.useEffect(() => {
    if (decision.action === "redirect") {
      router.replace(decision.to);
    }
  }, [decision, router]);

  if (!isHydrated || decision.action === "redirect") {
    return <LoadingState label="Memuat sesi..." />;
  }

  return <>{children}</>;
}

function useAuthRole(): { role: UserRole | null; isHydrated: boolean } {
  const { user, isHydrated } = useAuth();
  return { role: user?.role ?? null, isHydrated };
}
