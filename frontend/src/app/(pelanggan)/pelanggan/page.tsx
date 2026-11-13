"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { Section } from "@/components/section";
import { PlateNumber } from "@/components/plate-number";
import { StatusBadge } from "@/components/status-badge";
import { StatusStepper } from "@/components/status-stepper";
import { TicketList } from "@/components/booking/ticket-list";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { TableSkeleton } from "@/components/loading-state";
import { OWN_BOOKINGS_LIMIT, useOwnBookings } from "@/hooks/use-queries";
import {
  activeBookings,
  groupByPlate,
  isTerminalStatus,
  sortNewestFirst,
} from "@/lib/derive";
import { formatDate } from "@/lib/format";
import { getStatusMeta } from "@/lib/status-meta";
import type { Booking } from "@/types/api";

const HISTORY_PREVIEW = 5;

export default function PelangganDashboardPage() {
  // The backend auto-scopes GET /bookings to the signed-in pelanggan.
  const { data, isLoading, isError, error, refetch } = useOwnBookings();
  const bookings = React.useMemo(() => data?.data ?? [], [data]);
  const total = data?.pagination?.total ?? bookings.length;

  const active = React.useMemo(() => activeBookings(bookings), [bookings]);
  const motors = React.useMemo(() => groupByPlate(bookings), [bookings]);
  const history = React.useMemo(
    () => sortNewestFirst(bookings.filter((b) => isTerminalStatus(b.status))),
    [bookings]
  );
  const [showAllHistory, setShowAllHistory] = React.useState(false);
  const shownHistory = showAllHistory
    ? history
    : history.slice(0, HISTORY_PREVIEW);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 space-y-8 px-4 py-6 sm:px-6">
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
          description="Pesan servis online, lalu pantau status motor Anda di sini."
          action={
            <Button asChild size="sm">
              <Link href="/pelanggan/baru">Pesan Servis</Link>
            </Button>
          }
        />
      ) : (
        <>
          <Section title="Servis aktif">
            {active.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Tidak ada motor di bengkel saat ini.
              </p>
            ) : (
              <div className="space-y-3">
                {active.map((booking) => (
                  <ActiveServiceCard key={booking._id} booking={booking} />
                ))}
              </div>
            )}
          </Section>

          <Section title="Motor Saya">
            <ul className="divide-y border-y">
              {motors.map((motor) => (
                <li key={motor.plateNumber}>
                  <Link
                    href={`/pelanggan/motor/${encodeURIComponent(motor.plateNumber)}`}
                    className="flex items-center gap-3 py-3 hover:bg-muted/50 sm:px-2"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <PlateNumber plate={motor.plateNumber} size="sm" />
                        <span className="font-semibold">{motor.motorModel}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {motor.serviceCount} kali servis · terakhir{" "}
                        {formatDate(
                          motor.lastBooking.serviceDate ??
                            motor.lastBooking.createdAt
                        )}
                        {motor.inService && " · sedang di bengkel"}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          </Section>

          <Section title="Riwayat">
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Belum ada servis yang selesai.
              </p>
            ) : (
              <div className="space-y-3">
                <TicketList
                  bookings={shownHistory}
                  hrefFor={(b) => `/pelanggan/${b._id}`}
                  showTotal
                />
                {history.length > HISTORY_PREVIEW && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAllHistory((v) => !v)}
                  >
                    {showAllHistory
                      ? "Tampilkan lebih sedikit"
                      : `Tampilkan semua (${history.length})`}
                  </Button>
                )}
              </div>
            )}
          </Section>

          {total > OWN_BOOKINGS_LIMIT && (
            <p className="text-xs text-muted-foreground">
              Menampilkan {OWN_BOOKINGS_LIMIT} servis terbaru dari {total}.
            </p>
          )}
        </>
      )}
    </main>
  );
}

function ActiveServiceCard({ booking }: { booking: Booking }) {
  return (
    <Link
      href={`/pelanggan/${booking._id}`}
      className="block space-y-4 border bg-card p-4 transition-colors hover:border-foreground/40"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <PlateNumber plate={booking.plateNumber} />
            <span className="font-semibold">{booking.motorModel}</span>
          </div>
          <p className="text-xs tabular-nums text-muted-foreground">
            {booking.bookingNumber}
            {booking.serviceName && ` · ${booking.serviceName}`}
          </p>
        </div>
        <StatusBadge status={booking.status} />
      </div>
      <StatusStepper status={booking.status} />
      <p className="flex items-center justify-between gap-2 text-sm">
        <span>{getStatusMeta(booking.status).description}.</span>
        <span className="flex shrink-0 items-center text-primary">
          Lacak
          <ChevronRight className="h-4 w-4" />
        </span>
      </p>
    </Link>
  );
}
