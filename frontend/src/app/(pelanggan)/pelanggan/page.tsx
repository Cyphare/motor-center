"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, Wrench } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { TableSkeleton } from "@/components/loading-state";
import { useBookings } from "@/hooks/use-queries";
import { formatDate, formatRupiah } from "@/lib/format";

export default function PelangganDashboardPage() {
  const [page, setPage] = React.useState(1);

  // The backend auto-scopes GET /bookings to the authenticated pelanggan's own
  // tickets.
  const { data, isLoading, isError, error, refetch } = useBookings({
    page,
    limit: 10,
  });
  const bookings = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <PageHeader
        title="Servis Saya"
        description="Riwayat dan status pengerjaan servis kendaraan Anda."
        actions={
          <Button asChild size="sm">
            <Link href="/pelanggan/baru">
              <Plus className="mr-1 h-4 w-4" />
              Pesan Servis
            </Link>
          </Button>
        }
      />

      <div className="mt-8">
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
            title="Belum ada servis"
            description="Anda belum memiliki pesanan servis. Mulai dengan memesan servis online."
            action={
              <Button asChild size="sm">
                <Link href="/pelanggan/baru">Pesan Servis</Link>
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4">
            {bookings.map((booking) => (
              <Link key={booking._id} href={`/pelanggan/${booking._id}`}>
                <Card className="transition-colors hover:border-primary/50">
                  <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                    <div className="space-y-1">
                      <CardTitle className="text-base">
                        {booking.bookingNumber}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {booking.plateNumber} &middot; {booking.motorModel}
                      </p>
                    </div>
                    <StatusBadge status={booking.status} />
                  </CardHeader>
                  <CardContent className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
                    <span className="line-clamp-1 max-w-sm">
                      {booking.complaint}
                    </span>
                    <span className="flex items-center gap-4">
                      <span>{formatDate(booking.createdAt)}</span>
                      <span className="font-medium text-foreground">
                        {formatRupiah(booking.grandTotal)}
                      </span>
                    </span>
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
            {pagination.total} riwayat servis
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
