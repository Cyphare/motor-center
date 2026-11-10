"use client";

import * as React from "react";
import Link from "next/link";
import { Wrench } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { PlateNumber } from "@/components/plate-number";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { TableSkeleton } from "@/components/loading-state";
import { useBookings } from "@/hooks/use-queries";
import type { ServiceStatus } from "@/types/api";
import { formatDate } from "@/lib/format";

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
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <PageHeader
        title="Tiket Saya"
        description="Tiket servis yang ditugaskan kepada Anda."
      />

      <div className="mt-6">
        <Tabs
          value={filter}
          onValueChange={(value) => {
            setFilter(value as ServiceStatus | "all");
            setPage(1);
          }}
        >
          <TabsList className="h-auto flex-wrap">
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
            icon={<Wrench className="h-8 w-8" />}
            title="Tidak ada tiket"
            description="Belum ada tiket yang cocok dengan filter ini."
          />
        ) : (
          <div className="grid gap-4">
            {bookings.map((booking) => (
              <Link key={booking._id} href={`/mekanik/${booking._id}`}>
                <Card className="transition-colors hover:border-primary/50">
                  <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                    <div className="space-y-1">
                      <CardTitle className="text-base">
                        {booking.bookingNumber}
                      </CardTitle>
                      <p className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
                        <PlateNumber plate={booking.plateNumber} size="sm" /> {booking.motorModel}
                      </p>
                    </div>
                    <StatusBadge status={booking.status} />
                  </CardHeader>
                  <CardContent className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
                    <span className="line-clamp-1 max-w-sm">
                      {booking.complaint}
                    </span>
                    <span>{formatDate(booking.createdAt)}</span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
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
