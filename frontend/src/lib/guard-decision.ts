import type { UserRole } from "@/types/api";
import { homeForRole, isRoleAllowed } from "@/lib/roles";

export type GuardDecision =
  | { action: "allow" }
  | { action: "redirect"; to: string };

export interface GuardInput {
  isHydrated: boolean;
  role: UserRole | null;
  allowedRoles: UserRole[];
  loginPath?: string;
}

/**
 * Pure redirect decision for the role guard:
 * - while hydrating, allow (the component renders a loading state)
 * - unauthenticated -> redirect to /login
 * - authenticated but wrong role -> redirect to the role's home
 * - otherwise allow
 */
export function decideGuard({
  isHydrated,
  role,
  allowedRoles,
  loginPath = "/login",
}: GuardInput): GuardDecision {
  if (!isHydrated) {
    return { action: "allow" };
  }
  if (!role) {
    return { action: "redirect", to: loginPath };
  }
  if (!isRoleAllowed(role, allowedRoles)) {
    return { action: "redirect", to: homeForRole(role) };
  }
  return { action: "allow" };
}
