"use client";

import { Clock, Wrench } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { useServices } from "@/hooks/use-queries";
import { formatRupiah } from "@/lib/format";

function formatDuration(minutes: number): string {
  if (!minutes || minutes <= 0) return "-";
  if (minutes < 60) return `${minutes} menit`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} jam` : `${hours} jam ${rest} menit`;
}

/**
 * Shared service catalog list. Fetches services via useServices and renders
 * loading / error / empty / list states. Used by both the public catalog page
 * and the authenticated pelanggan services view so the data and presentation
 * stay in one place.
 */
export function ServiceCatalog() {
  const { data, isLoading, isError, error, refetch } = useServices();
  const services = data ?? [];

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index}>
            <CardHeader className="space-y-3">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </CardHeader>
            <CardFooter className="gap-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        message={error instanceof Error ? error.message : undefined}
        onRetry={() => refetch()}
      />
    );
  }

  if (services.length === 0) {
    return (
      <EmptyState
        icon={<Wrench className="h-8 w-8" />}
        title="Belum ada layanan"
        description="Daftar layanan belum tersedia. Silakan hubungi bengkel untuk informasi lebih lanjut."
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {services.map((service) => (
        <Card key={service._id} className="flex flex-col">
          <CardHeader className="flex-1">
            <CardTitle>{service.name}</CardTitle>
            <CardDescription>{service.description}</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between text-sm">
            <span className="font-semibold text-foreground">
              {formatRupiah(service.estimatedPrice)}
            </span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-4 w-4" />
              {formatDuration(service.estimatedDurationMinutes)}
            </span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
