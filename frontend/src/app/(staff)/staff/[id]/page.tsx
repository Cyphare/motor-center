"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Download, Plus, Trash2, UserCog } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useBooking, useMechanics, useParts } from "@/hooks/use-queries";
import {
  useAddPart,
  useAssignMechanic,
  useRemovePart,
  useUpdateStatus,
} from "@/hooks/use-mutations";
import { invoicePdfBlob } from "@/services/bookings";
import { ApiRequestError } from "@/lib/api-client";
import { canAssignMechanic, nextStatuses } from "@/lib/transitions";
import type { Booking, Mechanic, ServiceStatus } from "@/types/api";
import { formatDateTime, formatRupiah } from "@/lib/format";

const PARTS_EDITABLE_STATUSES: ServiceStatus[] = ["Diperiksa", "Dikerjakan"];

// mechanicId may arrive as a raw id string or a populated object.
function assignedMechanic(booking: Booking): { id: string; name?: string } | null {
  const ref = booking.mechanicId;
  if (!ref) return null;
  if (typeof ref === "string") return { id: ref };
  return { id: ref._id, name: ref.name };
}

export default function StaffBookingDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const { data: booking, isLoading, isError, error, refetch } = useBooking(id);
  const updateStatus = useUpdateStatus();
  const assignMechanic = useAssignMechanic();
  const addPart = useAddPart();
  const removePart = useRemovePart();

  const partsEditable = Boolean(
    booking && PARTS_EDITABLE_STATUSES.includes(booking.status)
  );
  const { data: partsData } = useParts({}, partsEditable);
  const parts = partsData?.data ?? [];

  const { data: mechanicsData } = useMechanics();
  const mechanics = mechanicsData ?? [];

  const [notes, setNotes] = React.useState("");
  const [serviceFee, setServiceFee] = React.useState("");
  const [selectedPart, setSelectedPart] = React.useState("");
  const [quantity, setQuantity] = React.useState("1");
  const [assignOpen, setAssignOpen] = React.useState(false);
  const [assignValue, setAssignValue] = React.useState("");
  const [downloading, setDownloading] = React.useState(false);

  const mechanic = booking ? assignedMechanic(booking) : null;

  // admin/kasir get the full legal transition set, including
  // Antre->Dibatalkan and Selesai->Diambil (checkout).
  const advanceOptions = booking ? nextStatuses(booking.status) : [];

  function handleAdvance(nextStatus: ServiceStatus) {
    if (!id || !booking) return;
    // Backend rejects Diperiksa without an assigned mechanic; block in the UI.
    if (nextStatus === "Diperiksa" && !mechanic) {
      toast.error("Tugaskan mekanik terlebih dahulu sebelum ke Diperiksa");
      setAssignOpen(true);
      return;
    }
    const fee = serviceFee.trim();
    updateStatus.mutate({
      id,
      data: {
        status: nextStatus,
        ...(notes.trim() ? { mechanicNotes: notes.trim() } : {}),
        ...(fee !== "" ? { serviceFee: Number(fee) } : {}),
      },
    });
    setNotes("");
    setServiceFee("");
  }

  function handleAssign() {
    if (!id || !assignValue) return;
    assignMechanic.mutate(
      { id, mechanicId: assignValue },
      {
        onSuccess: () => {
          setAssignOpen(false);
          setAssignValue("");
        },
      }
    );
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

  const canAssign = canAssignMechanic(booking.status);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
        <Link href="/staff">
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
            {booking.status === "Diambil" && (
              <Button onClick={handleDownload} disabled={downloading}>
                <Download className="mr-1 h-4 w-4" />
                {downloading ? "Mengunduh..." : "Unduh Invoice (PDF)"}
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
            <div className="space-y-1">
              <CardTitle className="text-base">Pelanggan & Mekanik</CardTitle>
              <CardDescription>
                {booking.customerName} &middot; {booking.customerPhone}
              </CardDescription>
            </div>
            {canAssign && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setAssignValue(mechanic?.id ?? "");
                  setAssignOpen(true);
                }}
              >
                <UserCog className="mr-1 h-4 w-4" />
                {mechanic ? "Ganti Mekanik" : "Tugaskan Mekanik"}
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">Mekanik: </span>
              {mechanic?.name ?? (mechanic ? "Ditugaskan" : "Belum ditugaskan")}
            </p>
            <p>
              <span className="font-medium text-foreground">Keluhan: </span>
              {booking.complaint}
            </p>
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
              Pilih status berikutnya yang diizinkan untuk tiket ini.
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
                <div className="space-y-2">
                  <Label htmlFor="serviceFee">Biaya jasa (opsional)</Label>
                  <Input
                    id="serviceFee"
                    type="number"
                    min={0}
                    value={serviceFee}
                    onChange={(event) => setServiceFee(event.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {advanceOptions.map((status) => {
                    const needsMechanic = status === "Diperiksa" && !mechanic;
                    return (
                      <Button
                        key={status}
                        onClick={() => handleAdvance(status)}
                        disabled={updateStatus.isPending}
                        variant={
                          status === "Dibatalkan" ? "destructive" : "default"
                        }
                        title={
                          needsMechanic
                            ? "Tugaskan mekanik terlebih dahulu"
                            : undefined
                        }
                      >
                        {status === "Dibatalkan"
                          ? "Batalkan Tiket"
                          : status === "Diambil"
                            ? "Checkout (Diambil)"
                            : `Ubah ke ${status}`}
                      </Button>
                    );
                  })}
                </div>
                {advanceOptions.includes("Diperiksa") && !mechanic && (
                  <p className="text-sm text-amber-700">
                    Tugaskan mekanik terlebih dahulu untuk dapat melanjutkan ke
                    Diperiksa.
                  </p>
                )}
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
                  <Select value={selectedPart} onValueChange={setSelectedPart}>
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

      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tugaskan Mekanik</DialogTitle>
            <DialogDescription>
              Pilih mekanik yang menangani tiket ini.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Mekanik</Label>
            <Select value={assignValue} onValueChange={setAssignValue}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih mekanik" />
              </SelectTrigger>
              <SelectContent>
                {mechanics.map((item: Mechanic) => (
                  <SelectItem key={item._id} value={item._id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAssignOpen(false)}
              disabled={assignMechanic.isPending}
            >
              Batal
            </Button>
            <Button
              onClick={handleAssign}
              disabled={!assignValue || assignMechanic.isPending}
            >
              {assignMechanic.isPending ? "Menyimpan..." : "Tugaskan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
