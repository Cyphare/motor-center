"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Mail } from "lucide-react";

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
import { TRACKING_REFETCH_MS, useBooking } from "@/hooks/use-queries";
import { useAuth } from "@/hooks/use-auth";
import { isTerminalStatus } from "@/lib/derive";
import { formatDateTime } from "@/lib/format";
import { getStatusMeta } from "@/lib/status-meta";

export default function PelangganBookingDetailPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const justCreated = searchParams?.get("baru") === "1";
  const { user } = useAuth();
  const id = params?.id;
  const { data: booking, isLoading, isError, error, refetch, dataUpdatedAt } =
    useBooking(id, { pollMs: TRACKING_REFETCH_MS });

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

  const live = !isTerminalStatus(booking.status);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 space-y-8 px-4 py-6 sm:px-6">
      {justCreated && (
        <div
          role="status"
          className="flex items-start gap-2 border-l-2 border-primary bg-primary/10 px-3 py-2.5 text-sm"
        >
          <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <span>
            Pesanan diterima. Email konfirmasi telah dikirim ke
            {user?.email ? ` ${user.email}` : " alamat email akun Anda"}.
          </span>
        </div>
      )}

      <TicketHeader booking={booking} backHref="/pelanggan" showCustomer={false} />

      <div className="space-y-4">
        <StatusStepper status={booking.status} />
        <p className="text-sm">
          {booking.status === "Selesai"
            ? "Motor siap diambil. Kami sudah mengirim email ke alamat akun Anda."
            : getStatusMeta(booking.status).description + "."}
        </p>
        {live && (
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="relative flex h-2 w-2" aria-hidden>
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-status-selesai opacity-60 motion-reduce:hidden" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-status-selesai" />
            </span>
            Status diperbarui otomatis · terakhir{" "}
            {formatDateTime(dataUpdatedAt)}
          </p>
        )}
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
          <p>
            <Link
              href={`/pelanggan/motor/${encodeURIComponent(booking.plateNumber)}`}
              className="text-primary underline-offset-4 hover:underline"
            >
              Riwayat servis motor ini
            </Link>
          </p>
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
