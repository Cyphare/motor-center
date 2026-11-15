import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

/** Inline error: a destructive rule on the left, no tinted box. */
export function ErrorState({
  title = "Terjadi kesalahan",
  message,
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-start gap-1 border-l-2 border-destructive py-2 pl-4 text-sm",
        className
      )}
    >
      <p className="font-semibold text-destructive">{title}</p>
      {message && <p className="text-muted-foreground">{message}</p>}
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-2" onClick={onRetry}>
          Coba lagi
        </Button>
      )}
    </div>
  );
}
