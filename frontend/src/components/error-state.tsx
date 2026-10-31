import * as React from "react";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Terjadi kesalahan",
  message,
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-red-200 bg-red-50 p-8 text-center",
        className
      )}
    >
      <AlertTriangle className="mb-3 h-7 w-7 text-red-600" />
      <h3 className="text-sm font-semibold text-red-800">{title}</h3>
      {message && <p className="mt-1 text-sm text-red-700">{message}</p>}
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={onRetry}
        >
          Coba lagi
        </Button>
      )}
    </div>
  );
}
