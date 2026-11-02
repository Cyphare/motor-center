"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, LineChart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { RoleGuard } from "@/components/guards/role-guard";
import { useAuth } from "@/hooks/use-auth";

export default function OwnerLayout({
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

  // Staff (admin ke staff) dan manajemen pengguna hanya untuk admin.
  const isAdmin = user?.role === "admin";

  return (
    <RoleGuard allowedRoles={["pemilik", "admin"]}>
      <div className="flex min-h-full flex-1 flex-col">
        <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
          <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2 px-6 py-4">
            <Link
              href="/owner"
              className="flex items-center gap-2 font-semibold"
            >
              <LineChart className="h-5 w-5 text-primary" />
              <span>MotorCenter Laporan</span>
            </Link>
            <nav className="flex flex-wrap items-center gap-1">
              <Button asChild variant="ghost" size="sm">
                <Link href="/owner">Dasbor</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/owner/revenue">Laporan Omzet</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/owner/low-stock">Stok Menipis</Link>
              </Button>
              {isAdmin && (
                <>
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/owner/users">Pengguna</Link>
                  </Button>
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/staff">Operasional</Link>
                  </Button>
                </>
              )}
              <Button asChild variant="ghost" size="sm">
                <Link href="/owner/profil">Profil</Link>
              </Button>
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
