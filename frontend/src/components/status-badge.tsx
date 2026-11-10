import type { ServiceStatus } from "@/types/api";
import { Badge } from "@/components/ui/badge";
import { getStatusMeta } from "@/lib/status-meta";
import { cn } from "@/lib/utils";

export interface StatusBadgeProps {
  status: ServiceStatus;
  className?: string;
  /** Show the status icon before the label. Defaults to true. */
  withIcon?: boolean;
}

export function StatusBadge({
  status,
  className,
  withIcon = true,
}: StatusBadgeProps) {
  const meta = getStatusMeta(status);
  const Icon = meta.icon;
  return (
    <Badge
      variant="outline"
      className={cn("gap-1 whitespace-nowrap", meta.badgeClass, className)}
    >
      {withIcon && <Icon className="h-3.5 w-3.5" aria-hidden />}
      {meta.label}
    </Badge>
  );
}
