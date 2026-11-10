"use client";

import { RoleGuard } from "@/components/guards/role-guard";
import { BackofficeShell } from "@/components/shell/backoffice-shell";

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={["pemilik", "admin"]}>
      <BackofficeShell>{children}</BackofficeShell>
    </RoleGuard>
  );
}
