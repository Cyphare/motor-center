"use client";

import { useParams } from "next/navigation";

import { Section } from "@/components/section";
import { StatusStepper } from "@/components/status-stepper";
import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/loading-state";
import {
  CostSummary,
  InvoiceButton,
  StatusTimeline,
  TicketHeader,
} from "@/components/booking/ticket-blocks";
import { TicketParts } from "@/components/booking/ticket-parts";
import { useBooking } from "@/hooks/use-queries";
import { formatDateTime } from "@/lib/format";
import { getStatusMeta } from "@/lib/status-meta";

export default function PelangganBookingDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const { data: booking, isLoading, isError, error, refetch } = useBooking(id);

  if (isLoading) {
    return <LoadingState label="Memuat servis..." className="flex-1" />;
  }

  if (isError || !booking) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
        <ErrorState
          message={error instanceof Error ? error.message : undefined}
          onRetry={() => refetch()}
        />
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 space-y-8 px-4 py-6 sm:px-6">
      <TicketHeader booking={booking} backHref="/pelanggan" showCustomer={false} />

      <div className="space-y-4">
        <StatusStepper status={booking.status} />
        <p className="text-sm">
          {booking.status === "Selesai"
            ? "Motor siap diambil. Kami sudah mengirim email ke alamat akun Anda."
            : getStatusMeta(booking.status).description + "."}
        </p>
        <InvoiceButton booking={booking} />
      </div>

      <Section title="Keluhan">
        <div className="space-y-2 text-sm">
          <p>{booking.complaint}</p>
          {booking.serviceName && (
            <p>
              <span className="text-muted-foreground">Layanan: </span>
              {booking.serviceName}
            </p>
          )}
          {booking.serviceDate && (
            <p>
              <span className="text-muted-foreground">Jadwal: </span>
              {formatDateTime(booking.serviceDate)}
            </p>
          )}
          {booking.mechanicNotes && (
            <p className="border-l-2 border-primary pl-3 text-muted-foreground">
              Catatan mekanik: {booking.mechanicNotes}
            </p>
          )}
        </div>
      </Section>

      {booking.partsUsed.length > 0 && (
        <Section title="Suku cadang">
          <TicketParts booking={booking} />
        </Section>
      )}

      <Section title="Biaya">
        <CostSummary booking={booking} />
      </Section>

      <Section title="Riwayat">
        <StatusTimeline history={booking.statusHistory} />
      </Section>
    </main>
  );
}
