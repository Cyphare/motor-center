import * as React from "react";

import { cn } from "@/lib/utils";

export type IndicatorTone = "success" | "danger" | "warning" | "muted";

/**
 * Same visual language as StatusBadge (square + colored label), driven by
 * theme tokens so it reads correctly in light and dark mode. Use it for
 * simple states like Aktif/Nonaktif or a low-stock flag.
 */
const TONE: Record<IndicatorTone, { text: string; dot: string }> = {
  success: { text: "text-status-selesai", dot: "bg-status-selesai" },
  danger: { text: "text-destructive", dot: "bg-destructive" },
  warning: { text: "text-status-dikerjakan", dot: "bg-status-dikerjakan" },
  muted: { text: "text-muted-foreground", dot: "bg-muted-foreground/60" },
};

export interface IndicatorProps {
  tone: IndicatorTone;
  children: React.ReactNode;
  className?: string;
}

export function Indicator({ tone, children, className }: IndicatorProps) {
  const t = TONE[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold",
        t.text,
        className
      )}
    >
      <span aria-hidden className={cn("h-2 w-2 shrink-0 rounded-[1px]", t.dot)} />
      {children}
    </span>
  );
}
