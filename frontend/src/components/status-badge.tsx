import type { ServiceStatus } from "@/types/api";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<ServiceStatus, string> = {
  Antre: "bg-slate-100 text-slate-700 border-slate-200",
  Diperiksa: "bg-amber-100 text-amber-800 border-amber-200",
  Dikerjakan: "bg-blue-100 text-blue-800 border-blue-200",
  Selesai: "bg-emerald-100 text-emerald-800 border-emerald-200",
  Diambil: "bg-green-600 text-white border-green-600",
  Dibatalkan: "bg-red-100 text-red-800 border-red-200",
};

export interface StatusBadgeProps {
  status: ServiceStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge variant="outline" className={cn(STATUS_STYLES[status], className)}>
      {status}
    </Badge>
  );
}
