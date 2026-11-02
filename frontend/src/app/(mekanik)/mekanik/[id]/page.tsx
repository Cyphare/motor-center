"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { StatusStepper } from "@/components/status-stepper";
import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/loading-state";
import { useBooking, useParts } from "@/hooks/use-queries";
import {
  useAddPart,
  useRemovePart,
  useUpdateStatus,
} from "@/hooks/use-mutations";
import { nextStatusesForRole } from "@/lib/transitions";
import type { ServiceStatus } from "@/types/api";
import { formatRupiah } from "@/lib/format";

const PARTS_EDITABLE_STATUSES: ServiceStatus[] = ["Diperiksa", "Dikerjakan"];

export default function MekanikBookingDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const { data: booking, isLoading, isError, error, refetch } = useBooking(id);
  const updateStatus = useUpdateStatus();
  const addPart = useAddPart();
  const removePart = useRemovePart();

  const partsEditable = Boolean(
    booking && PARTS_EDITABLE_STATUSES.includes(booking.status)
  );
  const { data: partsData } = useParts({}, partsEditable);
  const parts = partsData ?? [];

  const [notes, setNotes] = React.useState("");
  const [selectedPart, setSelectedPart] = React.useState("");
  const [quantity, setQuantity] = React.useState("1");

  // A mekanik may only advance active work (Diperiksa, Dikerjakan, Selesai);
  // cancellation (Dibatalkan), checkout (Diambil), and serviceFee edits belong
  // strictly to admin/kasir.
  const advanceOptions = booking
    ? nextStatusesForRole(booking.status, "mekanik")
    : [];

  function handleAdvance(nextStatus: ServiceStatus) {
    if (!id) return;
    updateStatus.mutate({
      id,
      data: {
        status: nextStatus,
        ...(notes.trim() ? { mechanicNotes: notes.trim() } : {}),
      },
    });
    setNotes("");
  }

  function handleAddPart() {
    if (!id || !selectedPart) return;
    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty < 1) return;
    addPart.mutate(
      { id, data: { partId: selectedPart, quantity: qty } },
      {
        onSuccess: () => {
          setSelectedPart("");
          setQuantity("1");
        },
      }
    );
  }

  function handleRemovePart(partItemId: string) {
    if (!id) return;
    removePart.mutate({ id, partItemId });
  }

  if (isLoading) {
    return <LoadingState label="Memuat detail tiket..." className="flex-1" />;
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
        <Link href="/mekanik">
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
          <CardContent>
            <StatusStepper status={booking.status} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Keluhan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>{booking.complaint}</p>
            {booking.mechanicNotes && (
              <p>
                <span className="font-medium text-foreground">
                  Catatan mekanik:{" "}
                </span>
                {booking.mechanicNotes}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Perbarui Status</CardTitle>
            <CardDescription>
              Pilih status pengerjaan berikutnya yang diizinkan untuk tiket ini.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {advanceOptions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Tidak ada perubahan status yang tersedia untuk tiket ini.
              </p>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="mechanicNotes">Catatan (opsional)</Label>
                  <Input
                    id="mechanicNotes"
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="Catatan pengerjaan"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {advanceOptions.map((status) => (
                    <Button
                      key={status}
                      onClick={() => handleAdvance(status)}
                      disabled={updateStatus.isPending}
                    >
                      {`Ubah ke ${status}`}
                    </Button>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Suku Cadang</CardTitle>
            <CardDescription>
              {partsEditable
                ? "Tambah atau batalkan suku cadang. Stok menyesuaikan otomatis."
                : "Suku cadang hanya dapat diubah saat status Diperiksa atau Dikerjakan."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {booking.partsUsed.length > 0 ? (
              <div className="space-y-2 text-sm">
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
                    <div className="flex items-center gap-3">
                      <span className="font-medium">
                        {formatRupiah(part.subtotal)}
                      </span>
                      {partsEditable && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemovePart(part._id)}
                          disabled={removePart.isPending}
                          aria-label={`Batalkan ${part.name}`}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Belum ada suku cadang yang dipakai.
              </p>
            )}

            {partsEditable && (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <div className="flex-1 space-y-2">
                  <Label>Suku cadang</Label>
                  <Select
                    value={selectedPart}
                    onValueChange={setSelectedPart}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih suku cadang" />
                    </SelectTrigger>
                    <SelectContent>
                      {parts.map((part) => (
                        <SelectItem
                          key={part._id}
                          value={part._id}
                          disabled={part.stock <= 0}
                        >
                          {part.name} (stok: {part.stock})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full space-y-2 sm:w-24">
                  <Label htmlFor="quantity">Jumlah</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(event) => setQuantity(event.target.value)}
                  />
                </div>
                <Button
                  onClick={handleAddPart}
                  disabled={!selectedPart || addPart.isPending}
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Tambah
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

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
      </div>
    </main>
  );
}
