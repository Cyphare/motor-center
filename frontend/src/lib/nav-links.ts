// Navigation link definitions for the authenticated areas. Kept as plain data
// (separate from presentation) so destinations can be unit-tested.
//
// Invariant: links shown inside an authenticated area must stay within an
// area the viewing role may enter. The pelanggan "Layanan" link in particular
// must NOT point at the public /catalog surface, otherwise clicking it swaps
// the authenticated layout for the logged-out public layout and the user
// appears logged out.

import {
  BarChart3,
  CalendarPlus,
  ClipboardList,
  LayoutDashboard,
  ListChecks,
  Package,
  PackageX,
  PlusCircle,
  Tags,
  User,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";

import type { UserRole } from "@/types/api";

export interface NavLink {
  href: string;
  label: string;
  icon?: LucideIcon;
}

export interface NavGroup {
  label: string;
  links: NavLink[];
}

export const PELANGGAN_NAV_LINKS: NavLink[] = [
  { href: "/pelanggan", label: "Servis Saya", icon: ClipboardList },
  { href: "/pelanggan/baru", label: "Pesan Servis", icon: CalendarPlus },
  { href: "/pelanggan/layanan", label: "Layanan", icon: Tags },
  { href: "/pelanggan/profil", label: "Profil", icon: User },
];

export const MEKANIK_NAV_LINKS: NavLink[] = [
  { href: "/mekanik", label: "Tiket Saya", icon: Wrench },
  { href: "/mekanik/profil", label: "Profil", icon: User },
];

interface RoleScopedGroup extends NavGroup {
  roles: UserRole[];
}

const BACKOFFICE_GROUPS: RoleScopedGroup[] = [
  {
    label: "Operasional",
    roles: ["admin", "kasir"],
    links: [
      { href: "/staff", label: "Antrean", icon: ListChecks },
      { href: "/staff/baru", label: "Tiket Baru", icon: PlusCircle },
    ],
  },
  {
    label: "Master Data",
    roles: ["admin", "kasir"],
    links: [
      { href: "/staff/parts", label: "Suku Cadang", icon: Package },
      { href: "/staff/services", label: "Layanan", icon: Tags },
    ],
  },
  {
    label: "Laporan",
    roles: ["admin", "pemilik"],
    links: [
      { href: "/owner", label: "Dasbor", icon: LayoutDashboard },
      { href: "/owner/revenue", label: "Laporan Omzet", icon: BarChart3 },
      { href: "/owner/low-stock", label: "Stok Menipis", icon: PackageX },
    ],
  },
  {
    label: "Admin",
    roles: ["admin"],
    links: [{ href: "/owner/users", label: "Pengguna", icon: Users }],
  },
];

/**
 * Sidebar groups for the back-office shell (staff + owner areas), filtered
 * to what the role may open. Mirrors backend RBAC: kasir never sees reports,
 * pemilik never sees operations, admin sees everything.
 */
export function backofficeNavFor(role: UserRole): NavGroup[] {
  return BACKOFFICE_GROUPS.filter((group) => group.roles.includes(role)).map(
    ({ label, links }) => ({ label, links })
  );
}

/** Profile page for a back-office role, inside an area that role may enter. */
export function backofficeProfileHref(role: UserRole): string {
  return role === "pemilik" ? "/owner/profil" : "/staff/profil";
}

/**
 * Which of `hrefs` should be highlighted for `pathname`: the longest href
 * that equals the path or is a path-segment prefix of it. So /staff/123
 * highlights /staff, while /staff/parts highlights /staff/parts.
 */
export function activeHref(
  pathname: string,
  hrefs: string[]
): string | undefined {
  let best: string | undefined;
  for (const href of hrefs) {
    const matches = pathname === href || pathname.startsWith(`${href}/`);
    if (matches && (!best || href.length > best.length)) {
      best = href;
    }
  }
  return best;
}
