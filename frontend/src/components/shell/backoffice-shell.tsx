"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu } from "lucide-react";

import { Brand } from "@/components/brand";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserAvatar, UserMenu, useLogout } from "@/components/shell/user-menu";
import { useAuth } from "@/hooks/use-auth";
import {
  activeHref,
  backofficeNavFor,
  backofficeProfileHref,
  type NavGroup,
} from "@/lib/nav-links";
import { ROLE_LABELS, homeForRole } from "@/lib/roles";
import { cn } from "@/lib/utils";

function SidebarNav({
  groups,
  onNavigate,
}: {
  groups: NavGroup[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const current = activeHref(
    pathname,
    groups.flatMap((g) => g.links.map((l) => l.href))
  );

  return (
    <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-4">
      {groups.map((group) => (
        <div key={group.label} className="space-y-1">
          <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-widest text-chrome-muted">
            {group.label}
          </p>
          {group.links.map((link) => {
            const Icon = link.icon;
            const isActive = link.href === current;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onNavigate}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "text-chrome-foreground before:absolute before:inset-y-1 before:-left-3 before:w-0.5 before:bg-primary"
                    : "text-chrome-muted hover:text-chrome-foreground"
                )}
              >
                {Icon && (
                  <Icon
                    className={cn("h-4 w-4", isActive && "text-primary")}
                  />
                )}
                {link.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

function SidebarFooter() {
  const { user } = useAuth();
  const handleLogout = useLogout();
  if (!user) return null;
  return (
    <div className="flex items-center gap-3 border-t border-chrome-border p-4">
      <UserAvatar name={user.name} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{user.name}</p>
        <p className="text-xs text-chrome-muted">{ROLE_LABELS[user.role]}</p>
      </div>
      <button
        type="button"
        onClick={handleLogout}
        className="rounded-md p-2 text-chrome-muted transition-colors hover:bg-chrome-border hover:text-chrome-foreground"
        aria-label="Keluar"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}

/**
 * App shell for the back-office (staff + owner areas): charcoal sidebar on
 * desktop, a slide-in drawer on small screens, and a slim top bar with the
 * theme toggle and account menu.
 */
export function BackofficeShell({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  if (!user) return null;
  const groups = backofficeNavFor(user.role);
  const home = homeForRole(user.role);

  return (
    <div className="flex min-h-full flex-1">
      <aside className="sticky top-0 hidden h-svh w-64 shrink-0 flex-col bg-chrome text-chrome-foreground lg:flex">
        <div className="flex h-16 items-center border-b border-chrome-border px-4">
          <Brand href={home} className="px-2" />
        </div>
        <SidebarNav groups={groups} />
        <SidebarFooter />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b bg-background/85 px-4 backdrop-blur sm:px-6">
          <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                aria-label="Buka menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent className="bg-chrome text-chrome-foreground">
              <SheetTitle className="sr-only">Navigasi</SheetTitle>
              <div className="flex h-16 items-center border-b border-chrome-border px-4">
                <Brand href={home} className="px-2" />
              </div>
              <SidebarNav
                groups={groups}
                onNavigate={() => setDrawerOpen(false)}
              />
              <SidebarFooter />
            </SheetContent>
          </Sheet>
          <Brand href={home} className="text-lg lg:hidden" />
          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <UserMenu profileHref={backofficeProfileHref(user.role)} />
          </div>
        </header>
        <div className="flex flex-1 flex-col">{children}</div>
      </div>
    </div>
  );
}
