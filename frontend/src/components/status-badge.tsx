import type { ServiceStatus } from "@/types/api";
import { getStatusMeta } from "@/lib/status-meta";
import { cn } from "@/lib/utils";

export interface StatusBadgeProps {
  status: ServiceStatus;
  className?: string;
}

/**
 * Status as a small colored square plus the label, in the status color.
 * Deliberately plain: it sits in dense rows and tables, so no pill or icon.
 */
export function StatusBadge({ status, className }: StatusBadgeProps) {
  const meta = getStatusMeta(status);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold",
        meta.textClass,
        className
      )}
    >
      <span
        aria-hidden
        className={cn("h-2 w-2 shrink-0 rounded-[1px]", meta.solidClass)}
      />
      {meta.label}
    </span>
  );
}
