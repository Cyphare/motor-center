import { Check, X } from "lucide-react";

import type { ServiceStatus } from "@/types/api";
import { SERVICE_STATUS_FLOW } from "@/types/api";
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
    return (
      <div
        className={cn(
          "flex items-center gap-2 text-sm font-medium text-red-700",
          className
        )}
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-red-100">
          <X className="h-4 w-4" />
        </span>
        Tiket dibatalkan
      </div>
    );
  }

  const currentIndex = SERVICE_STATUS_FLOW.indexOf(status);

  return (
    <ol className={cn("flex flex-wrap items-center gap-2", className)}>
      {SERVICE_STATUS_FLOW.map((step, index) => {
        const isDone = index < currentIndex;
        const isCurrent = index === currentIndex;
        return (
          <li key={step} className="flex items-center gap-2">
            <span
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold",
                isDone && "border-emerald-500 bg-emerald-500 text-white",
                isCurrent && "border-blue-600 bg-blue-600 text-white",
                !isDone && !isCurrent && "border-slate-300 text-slate-500"
              )}
            >
              {isDone ? <Check className="h-4 w-4" /> : index + 1}
            </span>
            <span
              className={cn(
                "text-xs font-medium",
                isCurrent ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {step}
            </span>
            {index < SERVICE_STATUS_FLOW.length - 1 && (
              <span className="mx-1 h-px w-6 bg-slate-200" aria-hidden />
            )}
          </li>
        );
      })}
    </ol>
  );
}
