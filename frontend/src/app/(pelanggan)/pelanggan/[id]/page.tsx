"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Download, Mail } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { StatusStepper } from "@/components/status-stepper";
import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/loading-state";
import { useBooking } from "@/hooks/use-queries";
import { invoicePdfBlob } from "@/services/bookings";
import { ApiRequestError } from "@/lib/api-client";
import { formatDateTime, formatRupiah } from "@/lib/format";

export default function PelangganBookingDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const { data: booking, isLoading, isError, error, refetch } = useBooking(id);
  const [downloading, setDownloading] = React.useState(false);

  async function handleDownload() {
    if (!id) return;
    setDownloading(true);
    try {
      const blob = await invoicePdfBlob(id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice-${booking?.bookingNumber ?? id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      const message =
        err instanceof ApiRequestError || err instanceof Error
          ? err.message
          : "Gagal mengunduh invoice";
      toast.error(message);
    } finally {
      setDownloading(false);
    }
  }

  if (isLoading) {
    return <LoadingState label="Memuat detail servis..." className="flex-1" />;
  }

  if (isError || !booking) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
        <ErrorState
          message={error instanceof Error ? error.message : undefined}
          onRetry={() => refetch()}
        />
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
        <Link href="/pelanggan">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Kembali
        </Link>
      </Button>

      <PageHeader
        title={booking.bookingNumber}
        description={`${booking.plateNumber} · ${booking.motorModel}`}
        actions={<StatusBadge status={booking.status} />}
      />

      <div className="mt-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status Pengerjaan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <StatusStepper status={booking.status} />

            {booking.status === "Selesai" && (
              <div className="flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                <Mail className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  Servis selesai. Email pemberitahuan telah dikirim ke alamat
                  email akun Anda.
                </span>
              </div>
            )}

            {booking.status === "Diambil" && (
              <Button onClick={handleDownload} disabled={downloading}>
                <Download className="mr-1 h-4 w-4" />
                {downloading ? "Mengunduh..." : "Unduh Invoice (PDF)"}
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Detail Keluhan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="text-muted-foreground">{booking.complaint}</p>
            {booking.serviceName && (
              <p>
                <span className="text-muted-foreground">Layanan: </span>
                {booking.serviceName}
              </p>
            )}
            {booking.serviceDate && (
              <p>
                <span className="text-muted-foreground">Jadwal servis: </span>
                {formatDateTime(booking.serviceDate)}
              </p>
            )}
          </CardContent>
        </Card>

        {booking.partsUsed.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Suku Cadang Dipakai</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {booking.partsUsed.map((part) => (
                <div
                  key={part._id}
                  className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0"
                >
                  <span>
                    {part.name}{" "}
                    <span className="text-muted-foreground">
                      &times;{part.quantity}
                    </span>
                  </span>
                  <span className="font-medium">
                    {formatRupiah(part.subtotal)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Rincian Biaya</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Biaya jasa</span>
              <span>{formatRupiah(booking.serviceFee)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total suku cadang</span>
              <span>{formatRupiah(booking.partsTotalCost)}</span>
            </div>
            <div className="flex items-center justify-between border-t pt-2 text-base font-semibold">
              <span>Total</span>
              <span>{formatRupiah(booking.grandTotal)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Riwayat Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-4">
              {booking.statusHistory.map((entry, index) => (
                <li key={index} className="flex gap-3">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={entry.status} />
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(entry.changedAt)}
                      </span>
                    </div>
                    {entry.notes && (
                      <p className="text-sm text-muted-foreground">
                        {entry.notes}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
