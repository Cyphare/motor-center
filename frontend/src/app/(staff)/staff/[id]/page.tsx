"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Section } from "@/components/section";
import { StatusStepper } from "@/components/status-stepper";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/loading-state";
import { AssignMechanicDialog } from "@/components/booking/assign-mechanic-dialog";
import {
  CostSummary,
  InvoiceButton,
  StatusTimeline,
  TicketHeader,
  assignedMechanic,
} from "@/components/booking/ticket-blocks";
import { TicketParts } from "@/components/booking/ticket-parts";
import { useBooking } from "@/hooks/use-queries";
import { useUpdateStatus } from "@/hooks/use-mutations";
import { canAssignMechanic, nextStatusesForRole } from "@/lib/transitions";
import { useAuthContext } from "@/lib/auth-context";
import type { Booking, ServiceStatus } from "@/types/api";

function actionLabel(status: ServiceStatus): string {
  if (status === "Dibatalkan") return "Batalkan tiket";
  if (status === "Diambil") return "Checkout · Diambil";
  return `Lanjut ke ${status}`;
}

export default function StaffBookingDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const { data: booking, isLoading, isError, error, refetch } = useBooking(id);
  const updateStatus = useUpdateStatus();
  const { user } = useAuthContext();

  const [notes, setNotes] = React.useState("");
  const [serviceFee, setServiceFee] = React.useState("");
  const [confirmCancel, setConfirmCancel] = React.useState(false);
  const [assignFor, setAssignFor] = React.useState<{
    booking: Booking;
    then?: ServiceStatus;
  } | null>(null);

  function submitStatus(target: Booking, status: ServiceStatus) {
    const fee = serviceFee.trim();
    updateStatus.mutate(
      {
        id: target._id,
        data: {
          status,
          ...(notes.trim() ? { mechanicNotes: notes.trim() } : {}),
          ...(fee !== "" ? { serviceFee: Number(fee) } : {}),
        },
      },
      {
        onSuccess: () => {
          setNotes("");
          setServiceFee("");
        },
      }
    );
  }

  function handleAdvance(status: ServiceStatus) {
    if (!booking) return;
    // Backend rejects Diperiksa without a mechanic: assign first, then move.
    if (status === "Diperiksa" && !assignedMechanic(booking)) {
      toast.info("Pilih mekanik dulu sebelum tiket diperiksa");
      setAssignFor({ booking, then: status });
      return;
    }
    submitStatus(booking, status);
  }

  if (isLoading) {
    return <LoadingState label="Memuat tiket..." className="flex-1" />;
  }

  if (isError || !booking) {
    return (
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <ErrorState
          message={error instanceof Error ? error.message : undefined}
          onRetry={() => refetch()}
        />
      </main>
    );
  }

  const mechanic = assignedMechanic(booking);
  // admin/kasir get the full legal set, incl. cancel and checkout.
  const role = user?.role === "admin" ? "admin" : "kasir";
  const advanceOptions = nextStatusesForRole(booking.status, role);
  const forward = advanceOptions.filter((s) => s !== "Dibatalkan");
  const canCancel = advanceOptions.includes("Dibatalkan");

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:py-8">
      <TicketHeader booking={booking} backHref="/staff" />

      <div className="my-6 border-y py-5">
        <StatusStepper status={booking.status} className="max-w-3xl" />
      </div>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-8">
          <Section title="Keluhan">
            <div className="space-y-2 text-sm">
              {booking.serviceName && (
                <p className="font-semibold">{booking.serviceName}</p>
              )}
              <p>{booking.complaint}</p>
              {booking.mechanicNotes && (
                <p className="border-l-2 border-primary pl-3 text-muted-foreground">
                  <span className="font-medium text-foreground">
                    Catatan mekanik:{" "}
                  </span>
                  {booking.mechanicNotes}
                </p>
              )}
            </div>
          </Section>

          <Section title="Suku cadang">
            <TicketParts booking={booking} editable />
          </Section>

          <Section title="Riwayat">
            <StatusTimeline history={booking.statusHistory} />
          </Section>
        </div>

        <aside className="space-y-8 lg:sticky lg:top-24 lg:self-start">
          <Section
            title="Mekanik"
            actions={
              canAssignMechanic(booking.status) ? (
                <button
                  type="button"
                  onClick={() => setAssignFor({ booking })}
                  className="text-xs font-medium underline underline-offset-4 hover:text-primary"
                >
                  {mechanic ? "Ganti" : "Tugaskan"}
                </button>
              ) : null
            }
          >
            <p className="text-sm">
              {mechanic?.name ??
                (mechanic ? (
                  "Ditugaskan"
                ) : (
                  <span className="text-status-dikerjakan">Belum ada</span>
                ))}
            </p>
          </Section>

          <Section title="Biaya">
            <CostSummary booking={booking} />
          </Section>

          {advanceOptions.length > 0 ? (
            <Section title="Tindakan">
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label
                    htmlFor="mechanicNotes"
                    className="text-xs text-muted-foreground"
                  >
                    Catatan
                  </Label>
                  <Input
                    id="mechanicNotes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Opsional"
                  />
                </div>
                <div className="space-y-1">
                  <Label
                    htmlFor="serviceFee"
                    className="text-xs text-muted-foreground"
                  >
                    Biaya jasa (Rp)
                  </Label>
                  <Input
                    id="serviceFee"
                    type="number"
                    min={0}
                    value={serviceFee}
                    onChange={(e) => setServiceFee(e.target.value)}
                    placeholder={String(booking.serviceFee || 0)}
                  />
                </div>
                {forward.map((status) => (
                  <Button
                    key={status}
                    className="w-full"
                    onClick={() => handleAdvance(status)}
                    disabled={updateStatus.isPending}
                  >
                    {actionLabel(status)}
                  </Button>
                ))}
                {canCancel && (
                  <button
                    type="button"
                    onClick={() => setConfirmCancel(true)}
                    disabled={updateStatus.isPending}
                    className="w-full py-1 text-sm text-destructive underline-offset-4 hover:underline disabled:opacity-50"
                  >
                    Batalkan tiket
                  </button>
                )}
              </div>
            </Section>
          ) : (
            <InvoiceButton booking={booking} />
          )}
        </aside>
      </div>

      <ConfirmDialog
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        title={`Batalkan ${booking.bookingNumber}?`}
        description={
          booking.partsUsed.length > 0
            ? "Tiket yang dibatalkan tidak bisa dilanjutkan lagi. Seluruh suku cadang yang terpasang akan otomatis dikembalikan ke stok gudang."
            : "Tiket yang dibatalkan tidak bisa dilanjutkan lagi."
        }
        confirmLabel="Batalkan tiket"
        cancelLabel="Kembali"
        destructive
        loading={updateStatus.isPending}
        onConfirm={() => {
          setConfirmCancel(false);
          handleAdvance("Dibatalkan");
        }}
      />

      <AssignMechanicDialog
        booking={assignFor?.booking ?? null}
        onOpenChange={(open) => {
          if (!open) setAssignFor(null);
        }}
        reason={
          assignFor?.then
            ? `Setelah ditugaskan, tiket langsung masuk ${assignFor.then}.`
            : undefined
        }
        onAssigned={(updated) => {
          const then = assignFor?.then;
          setAssignFor(null);
          if (then) submitStatus(updated, then);
        }}
      />
    </main>
  );
}
