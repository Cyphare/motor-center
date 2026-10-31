import type { UserRole } from "@/types/api";

// Role-based area routing. admin can reach both staff and owner areas; its
// default home is the staff dashboard.
export const ROLE_HOME: Record<UserRole, string> = {
  pelanggan: "/pelanggan",
  kasir: "/staff",
  admin: "/staff",
  mekanik: "/mekanik",
  pemilik: "/owner",
};

// Which roles are allowed to enter a given area root.
export const AREA_ROLES: Record<string, UserRole[]> = {
  "/pelanggan": ["pelanggan"],
  "/staff": ["kasir", "admin"],
  "/mekanik": ["mekanik"],
  "/owner": ["pemilik", "admin"],
};

export function homeForRole(role: UserRole): string {
  return ROLE_HOME[role] ?? "/";
}

/**
 * Returns the set of area roots a role is permitted to access.
 */
export function allowedAreas(role: UserRole): string[] {
  return Object.entries(AREA_ROLES)
    .filter(([, roles]) => roles.includes(role))
    .map(([area]) => area);
}

/**
 * Whether the given role may access an area defined by its list of allowed
 * roles. Used by the role guard.
 */
export function isRoleAllowed(
  role: UserRole,
  allowedRoles: UserRole[]
): boolean {
  return allowedRoles.includes(role);
}
