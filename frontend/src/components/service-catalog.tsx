"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { useServices } from "@/hooks/use-queries";
import { formatRupiah } from "@/lib/format";
import { cn } from "@/lib/utils";

function formatDuration(minutes: number): string {
  if (!minutes || minutes <= 0) return "-";
  if (minutes < 60) return `${minutes} mnt`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} jam` : `${hours} j ${rest} mnt`;
}

export interface ServiceCatalogProps {
  /** Show only the first N services (e.g. on the landing page). */
  limit?: number;
  className?: string;
}

/**
 * Service price list: one row per service with duration and starting price,
 * like the board on a workshop wall. Shared by the landing page, the public
 * catalog, and the pelanggan services view.
 */
export function ServiceCatalog({ limit, className }: ServiceCatalogProps) {
  const { data, isLoading, isError, error, refetch } = useServices();
  const services = (data ?? []).filter((s) => s.isActive !== false);
  const shown = limit ? services.slice(0, limit) : services;

  if (isError) {
    return (
      <ErrorState
        message={error instanceof Error ? error.message : undefined}
        onRetry={() => refetch()}
      />
    );
  }

  if (!isLoading && services.length === 0) {
    return (
      <EmptyState
        title="Daftar layanan belum tersedia"
        description="Tanyakan langsung ke bengkel untuk harga terbaru."
      />
    );
  }

  return (
    <table className={cn("w-full border-collapse text-sm", className)}>
      <thead>
        <tr className="border-b-2 border-foreground text-left text-xs uppercase tracking-wider text-muted-foreground">
          <th className="py-2 pr-4 font-semibold">Layanan</th>
          <th className="hidden w-28 py-2 pr-4 font-semibold sm:table-cell">
            Estimasi
          </th>
          <th className="w-32 py-2 text-right font-semibold">Mulai dari</th>
        </tr>
      </thead>
      <tbody>
        {isLoading
          ? Array.from({ length: limit ?? 5 }).map((_, i) => (
              <tr key={i} className="border-b">
                <td className="py-3 pr-4">
                  <Skeleton className="h-4 w-48" />
                </td>
                <td className="hidden py-3 pr-4 sm:table-cell">
                  <Skeleton className="h-4 w-14" />
                </td>
                <td className="py-3">
                  <Skeleton className="ml-auto h-4 w-20" />
                </td>
              </tr>
            ))
          : shown.map((service) => (
              <tr key={service._id} className="border-b align-top">
                <td className="py-3 pr-4">
                  <p className="font-semibold">{service.name}</p>
                  {service.description && (
                    <p className="mt-0.5 line-clamp-2 text-muted-foreground">
                      {service.description}
                    </p>
                  )}
                  <p className="mt-0.5 text-xs text-muted-foreground sm:hidden">
                    {formatDuration(service.estimatedDurationMinutes)}
                  </p>
                </td>
                <td className="hidden py-3 pr-4 tabular-nums text-muted-foreground sm:table-cell">
                  {formatDuration(service.estimatedDurationMinutes)}
                </td>
                <td className="py-3 text-right font-semibold tabular-nums">
                  {formatRupiah(service.estimatedPrice)}
                </td>
              </tr>
            ))}
      </tbody>
    </table>
  );
}
