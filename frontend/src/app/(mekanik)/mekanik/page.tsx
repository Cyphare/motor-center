"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/page-header";
import { TicketList } from "@/components/booking/ticket-list";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { TableSkeleton } from "@/components/loading-state";
import { useBookings } from "@/hooks/use-queries";
import type { ServiceStatus } from "@/types/api";

const FILTERS: { label: string; value: ServiceStatus | "all" }[] = [
  { label: "Semua", value: "all" },
  { label: "Antre", value: "Antre" },
  { label: "Diperiksa", value: "Diperiksa" },
  { label: "Dikerjakan", value: "Dikerjakan" },
  { label: "Selesai", value: "Selesai" },
  { label: "Diambil", value: "Diambil" },
  { label: "Dibatalkan", value: "Dibatalkan" },
];

export default function MekanikListPage() {
  const [filter, setFilter] = React.useState<ServiceStatus | "all">("all");
  const [page, setPage] = React.useState(1);

  // Backend scopes GET /bookings to tickets assigned to the authenticated
  // mekanik. The status filter narrows that list server-side.
  const query = React.useMemo(
    () => ({
      ...(filter === "all" ? {} : { status: filter }),
      page,
      limit: 10,
    }),
    [filter, page]
  );
  const { data, isLoading, isError, error, refetch } = useBookings(query);
  const bookings = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6">
      <PageHeader
        title="Tiket Saya"
      />

      <div className="mt-6">
        <Tabs
          value={filter}
          onValueChange={(value) => {
            setFilter(value as ServiceStatus | "all");
            setPage(1);
          }}
        >
          <TabsList className="w-full justify-start">
            {FILTERS.map((item) => (
              <TabsTrigger key={item.value} value={item.value}>
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <TableSkeleton rows={4} columns={1} />
        ) : isError ? (
          <ErrorState
            message={error instanceof Error ? error.message : undefined}
            onRetry={() => refetch()}
          />
        ) : bookings.length === 0 ? (
          <EmptyState
            title="Tidak ada tiket"
            description="Belum ada tiket yang cocok dengan filter ini."
          />
        ) : (
          <TicketList
            bookings={bookings}
            hrefFor={(b) => `/mekanik/${b._id}`}
          />
        )}
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Halaman {pagination.page} dari {pagination.totalPages} &middot;{" "}
            {pagination.total} tiket
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPage((current) => current + 1)}
            >
              Berikutnya
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}
