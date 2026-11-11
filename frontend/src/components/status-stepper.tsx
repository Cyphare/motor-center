import { Check, X } from "lucide-react";

import type { ServiceStatus } from "@/types/api";
import { SERVICE_STATUS_FLOW } from "@/types/api";
import { getStatusMeta } from "@/lib/status-meta";
import { cn } from "@/lib/utils";

export interface StatusStepperProps {
  status: ServiceStatus;
  className?: string;
}

/**
 * Horizontal stepper for the 5-stage flow (Antre -> Diambil). When the ticket
 * is Dibatalkan it renders a cancelled state instead of the normal steps.
 */
export function StatusStepper({ status, className }: StatusStepperProps) {
  if (status === "Dibatalkan") {
    const meta = getStatusMeta(status);
    return (
      <div
        className={cn(
          "flex items-center gap-2 text-sm font-medium",
          meta.textClass,
          className
        )}
      >
        <span
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full",
            meta.solidClass
          )}
        >
          <X className="h-4 w-4" />
        </span>
        Tiket dibatalkan
      </div>
    );
  }

  const currentIndex = SERVICE_STATUS_FLOW.indexOf(status);

  return (
    <ol
      className={cn("grid grid-cols-5 gap-1", className)}
      aria-label="Tahapan servis"
    >
      {SERVICE_STATUS_FLOW.map((step, index) => {
        const isDone = index < currentIndex;
        const isCurrent = index === currentIndex;
        const meta = getStatusMeta(step);
        const Icon = meta.icon;
        return (
          <li
            key={step}
            className="relative flex flex-col items-center gap-1.5 text-center"
            aria-current={isCurrent ? "step" : undefined}
          >
            {index > 0 && (
              <span
                aria-hidden
                className={cn(
                  "absolute right-1/2 top-4 h-0.5 w-full -translate-y-1/2",
                  index <= currentIndex ? "bg-status-selesai" : "bg-border"
                )}
              />
            )}
            <span
              className={cn(
                "relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 bg-card",
                isDone && "border-status-selesai bg-status-selesai text-background",
                isCurrent && meta.solidClass,
                !isDone && !isCurrent && "border-border text-muted-foreground"
              )}
            >
              {isDone ? (
                <Check className="h-4 w-4" />
              ) : (
                <Icon className="h-4 w-4" />
              )}
            </span>
            <span
              className={cn(
                "text-[11px] font-medium leading-tight sm:text-xs",
                isCurrent ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {meta.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
