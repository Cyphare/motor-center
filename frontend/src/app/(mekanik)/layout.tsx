"use client";

import { RoleGuard } from "@/components/guards/role-guard";
import { MobileShell } from "@/components/shell/mobile-shell";
import { MEKANIK_NAV_LINKS } from "@/lib/nav-links";

export default function MekanikLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={["mekanik"]}>
      <MobileShell
        links={MEKANIK_NAV_LINKS}
        homeHref="/mekanik"
        profileHref="/mekanik/profil"
        areaLabel="Mekanik"
      >
        {children}
      </MobileShell>
    </RoleGuard>
  );
}
