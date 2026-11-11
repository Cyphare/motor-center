import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { PlateNumber } from "@/components/plate-number";
import { StatusBadge } from "@/components/status-badge";
import { formatDate, formatRupiah } from "@/lib/format";
import type { Booking } from "@/types/api";

export interface TicketListProps {
  bookings: Booking[];
  hrefFor: (booking: Booking) => string;
  showTotal?: boolean;
}

/** Tap-friendly ticket rows for phone screens (mekanik, pelanggan). */
export function TicketList({ bookings, hrefFor, showTotal }: TicketListProps) {
  return (
    <ul className="divide-y border-y">
      {bookings.map((booking) => (
        <li key={booking._id}>
          <Link
            href={hrefFor(booking)}
            className="flex items-center gap-3 py-3.5 hover:bg-muted/50 sm:px-2"
          >
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <PlateNumber plate={booking.plateNumber} size="sm" />
                <span className="font-semibold">{booking.motorModel}</span>
              </div>
              <p className="line-clamp-1 text-sm text-muted-foreground">
                {booking.complaint}
              </p>
              <p className="flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
                <StatusBadge status={booking.status} />
                <span className="tabular-nums">{booking.bookingNumber}</span>
                <span>{formatDate(booking.serviceDate ?? booking.createdAt)}</span>
                {showTotal && booking.grandTotal > 0 && (
                  <span className="font-medium tabular-nums text-foreground">
                    {formatRupiah(booking.grandTotal)}
                  </span>
                )}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
