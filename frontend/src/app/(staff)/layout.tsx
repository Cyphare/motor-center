"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Store } from "lucide-react";

import { Button } from "@/components/ui/button";
import { RoleGuard } from "@/components/guards/role-guard";
import { useAuth } from "@/hooks/use-auth";

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, logout } = useAuth();

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  return (
    <RoleGuard allowedRoles={["admin", "kasir"]}>
      <div className="flex min-h-full flex-1 flex-col">
        <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
          <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2 px-6 py-4">
            <Link
              href="/staff"
              className="flex items-center gap-2 font-semibold"
            >
              <Store className="h-5 w-5 text-primary" />
              <span>MotorCenter Admin</span>
            </Link>
            <nav className="flex flex-wrap items-center gap-1">
              <Button asChild variant="ghost" size="sm">
                <Link href="/staff">Antrean</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/staff/baru">Tiket Baru</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/staff/parts">Suku Cadang</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/staff/services">Layanan</Link>
              </Button>
              {user?.role === "admin" && (
                <Button asChild variant="ghost" size="sm">
                  <Link href="/owner">Laporan</Link>
                </Button>
              )}
              {user && (
                <span className="hidden px-2 text-sm text-muted-foreground sm:inline">
                  {user.name}
                </span>
              )}
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="mr-1 h-4 w-4" />
                Keluar
              </Button>
            </nav>
          </div>
        </header>
        <div className="flex flex-1 flex-col">{children}</div>
      </div>
    </RoleGuard>
  );
}
