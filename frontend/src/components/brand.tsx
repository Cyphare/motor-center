import Link from "next/link";

import { cn } from "@/lib/utils";

export interface BrandProps {
  href?: string;
  className?: string;
}

/** Plain wordmark. No icon tile: the name is the logo. */
export function Brand({ href = "/", className }: BrandProps) {
  return (
    <Link
      href={href}
      className={cn(
        "font-display text-xl font-bold uppercase leading-none tracking-wide",
        className
      )}
    >
      Motor<span className="text-primary">Center</span>
    </Link>
  );
}
