import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Brand } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="sticky top-0 z-10 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Brand />
          <nav className="flex items-center gap-1 text-sm font-medium">
            <Link
              href="/catalog"
              className="hidden px-3 py-2 hover:text-primary sm:block"
            >
              Harga
            </Link>
            <Link href="/login" className="px-3 py-2 hover:text-primary">
              Masuk
            </Link>
            <ThemeToggle />
            <Button asChild size="sm" className="ml-1">
              <Link href="/register">Pesan servis</Link>
            </Button>
          </nav>
        </div>
      </header>
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
