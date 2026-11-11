"use client";

import * as React from "react";
import Link from "next/link";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { TicketList } from "@/components/booking/ticket-list";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { TableSkeleton } from "@/components/loading-state";
import { useBookings } from "@/hooks/use-queries";

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
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6">
      <PageHeader
        title="Servis Saya"
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
            title="Belum ada servis"
            description="Anda belum memiliki pesanan servis. Mulai dengan memesan servis online."
            action={
              <Button asChild size="sm">
                <Link href="/pelanggan/baru">Pesan Servis</Link>
              </Button>
            }
          />
        ) : (
          <TicketList
            bookings={bookings}
            hrefFor={(b) => `/pelanggan/${b._id}`}
            showTotal
          />
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
