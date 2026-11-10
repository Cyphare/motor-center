"use client";

import { RoleGuard } from "@/components/guards/role-guard";
import { MobileShell } from "@/components/shell/mobile-shell";
import { PELANGGAN_NAV_LINKS } from "@/lib/nav-links";

export default function PelangganLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={["pelanggan"]}>
      <MobileShell
        links={PELANGGAN_NAV_LINKS}
        homeHref="/pelanggan"
        profileHref="/pelanggan/profil"
      >
        {children}
      </MobileShell>
    </RoleGuard>
  );
}
