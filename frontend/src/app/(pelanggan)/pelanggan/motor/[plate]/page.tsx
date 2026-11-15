"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Section } from "@/components/section";
import { PlateNumber } from "@/components/plate-number";
import { TicketList } from "@/components/booking/ticket-list";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { TableSkeleton } from "@/components/loading-state";
import { useOwnBookings } from "@/hooks/use-queries";
import { bookingsForPlate, normalizePlate } from "@/lib/derive";
import { formatDate, formatRupiah } from "@/lib/format";

export default function MotorDetailPage() {
  const params = useParams<{ plate: string }>();
  const plate = normalizePlate(decodeURIComponent(params?.plate ?? ""));

  // Same query as the home page, so the cache is shared and the filter is
  // exact (the backend's plateNumber filter is a substring match).
  const { data, isLoading, isError, error, refetch } = useOwnBookings();
  const bookings = React.useMemo(
    () => bookingsForPlate(data?.data ?? [], plate),
    [data, plate]
  );

  const latest = bookings[0];
  // Only picked-up tickets are paid; open ones still carry estimates.
  const spent = bookings
    .filter((b) => b.status === "Diambil")
    .reduce((sum, b) => sum + (b.grandTotal ?? 0), 0);
  const first = bookings[bookings.length - 1];

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 space-y-8 px-4 py-6 sm:px-6">
      <div className="space-y-4 border-b pb-4">
        <Link
          href="/pelanggan"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Servis Saya
        </Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <PlateNumber plate={plate} size="lg" />
            {latest && (
              <h1 className="text-2xl font-bold leading-none tracking-tight">
                {latest.motorModel}
              </h1>
            )}
          </div>
          <Button asChild size="sm">
            <Link href={`/pelanggan/baru?plate=${encodeURIComponent(plate)}`}>
              <Plus className="mr-1 h-4 w-4" />
              Servis motor ini
            </Link>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton rows={3} columns={1} />
      ) : isError ? (
        <ErrorState
          message={error instanceof Error ? error.message : undefined}
          onRetry={() => refetch()}
        />
      ) : bookings.length === 0 ? (
        <EmptyState
          title="Belum ada riwayat"
          description="Belum ada servis untuk nomor plat ini di akun Anda."
        />
      ) : (
        <>
          <dl className="grid grid-cols-3 gap-4 text-sm">
            <Figure label="Servis">{bookings.length}x</Figure>
            <Figure label="Total dibayar">{formatRupiah(spent)}</Figure>
            <Figure label="Pertama">
              {formatDate(first?.serviceDate ?? first?.createdAt)}
            </Figure>
          </dl>

          <Section title="Riwayat servis">
            <TicketList
              bookings={bookings}
              hrefFor={(b) => `/pelanggan/${b._id}`}
              showTotal
            />
          </Section>
        </>
      )}
    </main>
  );
}

function Figure({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-display text-lg font-bold tabular-nums">{children}</dd>
    </div>
  );
}
