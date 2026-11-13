"use client";

import * as React from "react";
import { useParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Section } from "@/components/section";
import { StatusStepper } from "@/components/status-stepper";
import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/loading-state";
import {
  StatusTimeline,
  TicketHeader,
} from "@/components/booking/ticket-blocks";
import { TicketParts } from "@/components/booking/ticket-parts";
import { useBooking } from "@/hooks/use-queries";
import { useUpdateStatus } from "@/hooks/use-mutations";
import { nextStatusesForRole } from "@/lib/transitions";
import type { ServiceStatus } from "@/types/api";

export default function MekanikBookingDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const { data: booking, isLoading, isError, error, refetch } = useBooking(id);
  const updateStatus = useUpdateStatus();
  const [notes, setNotes] = React.useState("");

  function handleAdvance(nextStatus: ServiceStatus) {
    if (!id) return;
    updateStatus.mutate(
      {
        id,
        data: {
          status: nextStatus,
          ...(notes.trim() ? { mechanicNotes: notes.trim() } : {}),
        },
      },
      { onSuccess: () => setNotes("") }
    );
  }

  if (isLoading) {
    return <LoadingState label="Memuat tiket..." className="flex-1" />;
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

  // A mekanik only advances active work (Diperiksa, Dikerjakan, Selesai).
  // Cancel, checkout, and fee edits belong to admin/kasir.
  const advanceOptions = nextStatusesForRole(booking.status, "mekanik");

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 space-y-8 px-4 py-6 sm:px-6">
      <TicketHeader booking={booking} backHref="/mekanik" showCustomer={false} />

      <StatusStepper status={booking.status} />

      {advanceOptions.length > 0 && (
        <div className="space-y-3 border-y py-4">
          <div className="space-y-1">
            <Label htmlFor="mechanicNotes" className="text-xs text-muted-foreground">
              Catatan pengerjaan
            </Label>
            <Input
              id="mechanicNotes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Opsional, terlihat oleh kasir dan pelanggan"
            />
          </div>
          {advanceOptions.map((status) => (
            <Button
              key={status}
              size="lg"
              className="h-12 w-full text-base"
              onClick={() => handleAdvance(status)}
              disabled={updateStatus.isPending}
            >
              Tandai {status}
            </Button>
          ))}
        </div>
      )}

      <Section title="Keluhan">
        <div className="space-y-2 text-sm">
          {booking.serviceName && (
            <p className="font-semibold">{booking.serviceName}</p>
          )}
          <p>{booking.complaint}</p>
          {booking.mechanicNotes && (
            <p className="border-l-2 border-primary pl-3 text-muted-foreground">
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
    </main>
  );
}
