"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Wrench } from "lucide-react";

import { Button } from "@/components/ui/button";
import { RoleGuard } from "@/components/guards/role-guard";
import { useAuth } from "@/hooks/use-auth";

export default function PelangganLayout({
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
    <RoleGuard allowedRoles={["pelanggan"]}>
      <div className="flex min-h-full flex-1 flex-col">
        <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
          <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
            <Link
              href="/pelanggan"
              className="flex items-center gap-2 font-semibold"
            >
              <Wrench className="h-5 w-5 text-primary" />
              <span>MotorCenter</span>
            </Link>
            <nav className="flex items-center gap-2">
              <Button asChild variant="ghost" size="sm">
                <Link href="/pelanggan">Servis Saya</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/pelanggan/baru">Pesan Servis</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/catalog">Layanan</Link>
              </Button>
              {user && (
                <span className="hidden text-sm text-muted-foreground sm:inline">
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
