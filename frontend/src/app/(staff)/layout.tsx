"use client";

import { RoleGuard } from "@/components/guards/role-guard";
import { BackofficeShell } from "@/components/shell/backoffice-shell";

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={["admin", "kasir"]}>
      <BackofficeShell>{children}</BackofficeShell>
    </RoleGuard>
  );
}
