"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { PlateNumber } from "@/components/plate-number";
import { StatusBadge } from "@/components/status-badge";
import { ApiRequestError } from "@/lib/api-client";
import { formatDate, formatDateTime, formatRupiah } from "@/lib/format";
import { invoicePdfBlob } from "@/services/bookings";
import type { Booking, StatusHistoryEntry } from "@/types/api";

/** Back link, plate, motor, status and the key facts of a ticket. */
export function TicketHeader({
  booking,
  backHref,
  showCustomer = true,
}: {
  booking: Booking;
  backHref: string;
  showCustomer?: boolean;
}) {
  return (
    <header className="space-y-3">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali
      </Link>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <PlateNumber plate={booking.plateNumber} size="lg" />
        <h1 className="text-3xl font-bold leading-none">{booking.motorModel}</h1>
        <StatusBadge status={booking.status} className="text-sm" />
      </div>
      <p className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
        <span className="font-medium tabular-nums text-foreground">
          {booking.bookingNumber}
        </span>
        <span>{booking.bookingType === "online" ? "Online" : "Walk-in"}</span>
        <span>{formatDate(booking.serviceDate ?? booking.createdAt)}</span>
        {showCustomer && (
          <span>
            {booking.customerName} · {booking.customerPhone}
          </span>
        )}
      </p>
    </header>
  );
}

/** Service fee, parts total, and grand total. */
export function CostSummary({ booking }: { booking: Booking }) {
  return (
    <dl className="space-y-1.5 text-sm">
      <div className="flex justify-between">
        <dt className="text-muted-foreground">Jasa</dt>
        <dd className="tabular-nums">{formatRupiah(booking.serviceFee)}</dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-muted-foreground">Suku cadang</dt>
        <dd className="tabular-nums">{formatRupiah(booking.partsTotalCost)}</dd>
      </div>
      <div className="flex items-baseline justify-between border-t-2 border-foreground pt-2">
        <dt className="font-semibold">Total</dt>
        <dd className="font-display text-2xl font-bold tabular-nums">
          {formatRupiah(booking.grandTotal)}
        </dd>
      </div>
    </dl>
  );
}

/** Status changes, oldest first, with time and notes. */
export function StatusTimeline({ history }: { history: StatusHistoryEntry[] }) {
  if (history.length === 0) {
    return <p className="text-sm text-muted-foreground">Belum ada riwayat.</p>;
  }
  return (
    <ol className="text-sm">
      {history.map((entry, index) => (
        <li
          key={index}
          className="grid grid-cols-[minmax(0,9.5rem)_1fr] gap-3 border-b py-2 last:border-0"
        >
          <time className="whitespace-nowrap tabular-nums text-muted-foreground">
            {formatDateTime(entry.changedAt)}
          </time>
          <div>
            <StatusBadge status={entry.status} />
            {entry.notes && (
              <p className="mt-0.5 text-muted-foreground">{entry.notes}</p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

/** Download the invoice PDF (only offered once the ticket is Diambil). */
export function InvoiceButton({ booking }: { booking: Booking }) {
  const [downloading, setDownloading] = React.useState(false);

  async function handleDownload() {
    setDownloading(true);
    try {
      const blob = await invoicePdfBlob(booking._id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice-${booking.bookingNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(
        err instanceof ApiRequestError || err instanceof Error
          ? err.message
          : "Gagal mengunduh invoice"
      );
    } finally {
      setDownloading(false);
    }
  }

  if (booking.status !== "Diambil") return null;
  return (
    <Button
      variant="outline"
      className="w-full"
      onClick={handleDownload}
      disabled={downloading}
    >
      <Download className="h-4 w-4" />
      {downloading ? "Mengunduh..." : "Unduh invoice (PDF)"}
    </Button>
  );
}

/** Mechanic name from a populated or raw ref. */
export function assignedMechanic(
  booking: Booking
): { id: string; name?: string } | null {
  const ref = booking.mechanicId;
  if (!ref) return null;
  if (typeof ref === "string") return { id: ref };
  return { id: ref._id, name: ref.name };
}
