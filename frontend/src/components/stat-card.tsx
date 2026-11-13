import * as React from "react";

import { cn } from "@/lib/utils";

export interface StatCardProps {
  label: string;
  value: React.ReactNode;
  /** Accepted for compatibility; figures read better without icons. */
  icon?: React.ReactNode;
  hint?: string;
  className?: string;
}

/**
 * A single figure with its label. Flat on purpose: place several in a grid
 * with `divide-x` / borders rather than boxing each one.
 */
export function StatCard({ label, value, hint, className }: StatCardProps) {
  return (
    <div className={cn("space-y-1 py-1", className)}>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="font-display text-3xl font-bold leading-none tabular-nums">
        {value}
      </p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
