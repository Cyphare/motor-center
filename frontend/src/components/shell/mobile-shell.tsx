"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wrench } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/shell/user-menu";
import { activeHref, type NavLink } from "@/lib/nav-links";
import { cn } from "@/lib/utils";

export interface MobileShellProps {
  links: NavLink[];
  homeHref: string;
  profileHref: string;
  /** Short label after the brand, e.g. "Mekanik". */
  areaLabel?: string;
  children: React.ReactNode;
}

/**
 * Phone-first shell for mekanik and pelanggan: compact top bar, inline nav on
 * md+ screens, and a fixed bottom tab bar on small screens.
 */
export function MobileShell({
  links,
  homeHref,
  profileHref,
  areaLabel,
  children,
}: MobileShellProps) {
  const pathname = usePathname();
  const current = activeHref(
    pathname,
    links.map((l) => l.href)
  );

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-4 px-4 sm:px-6">
          <Link
            href={homeHref}
            className="flex items-center gap-2 font-display text-lg font-bold tracking-wide"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Wrench className="h-3.5 w-3.5" />
            </span>
            MotorCenter
            {areaLabel && (
              <span className="text-sm font-medium text-muted-foreground">
                {areaLabel}
              </span>
            )}
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Utama">
            {links.map((link) => {
              const isActive = link.href === current;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <UserMenu profileHref={profileHref} />
          </div>
        </div>
      </header>

      <div className="flex flex-1 flex-col pb-20 md:pb-0">{children}</div>

      <nav
        aria-label="Navigasi bawah"
        className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        <ul
          className="mx-auto grid max-w-md"
          style={{ gridTemplateColumns: `repeat(${links.length}, minmax(0, 1fr))` }}
        >
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = link.href === current;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {Icon && <Icon className="h-5 w-5" />}
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
