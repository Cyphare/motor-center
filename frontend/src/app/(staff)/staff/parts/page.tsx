"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { History, PackagePlus, Pencil, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Indicator } from "@/components/indicator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Form } from "@/components/ui/form";
import { FormField } from "@/components/form-field";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { TableSkeleton } from "@/components/loading-state";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  useLowStockParts,
  usePartMovements,
  useParts,
} from "@/hooks/use-queries";
import {
  useCreatePart,
  useDeletePart,
  useRestockPart,
  useUpdatePart,
} from "@/hooks/use-mutations";
import { applyApiFieldErrors } from "@/lib/form-errors";
import { formatDateTime, formatRupiah } from "@/lib/format";
import {
  partFormSchema,
  restockPartFormSchema,
  type PartFormValues,
  type RestockPartFormValues,
} from "@/lib/validations";
import type {
  Part,
  StockMovement,
  StockMovementType,
} from "@/types/api";

function toPartPayload(values: PartFormValues) {
  return {
    code: values.code.trim(),
    name: values.name.trim(),
    stock: Number(values.stock),
    minStock: Number(values.minStock),
    price: Number(values.price),
    unit: values.unit.trim(),
  };
}

const KNOWN_FIELDS = [
  "code",
  "name",
  "stock",
  "minStock",
  "price",
  "unit",
] as const;

const RESTOCK_KNOWN_FIELDS = ["quantity", "note"] as const;

function isLowStock(part: Part): boolean {
  return part.isLowStock ?? part.stock <= part.minStock;
}

export default function StaffPartsPage() {
  const [filterMode, setFilterMode] = React.useState<"all" | "low-stock">(
    "all"
  );

  const allPartsQuery = useParts(
    { includeInactive: true },
    filterMode === "all"
  );
  const lowStockQuery = useLowStockParts(filterMode === "low-stock");

  const activeQuery = filterMode === "low-stock" ? lowStockQuery : allPartsQuery;
  const parts = activeQuery.data ?? [];

  const [createOpen, setCreateOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Part | null>(null);
  const [restocking, setRestocking] = React.useState<Part | null>(null);
  const [historyPart, setHistoryPart] = React.useState<Part | null>(null);
  const [toggleTarget, setToggleTarget] = React.useState<Part | null>(null);

  const deletePart = useDeletePart();
  const reactivatePart = useUpdatePart();
  const togglePending = deletePart.isPending || reactivatePart.isPending;

  function handleConfirmToggle() {
    if (!toggleTarget) return;
    if (toggleTarget.isActive) {
      deletePart.mutate(toggleTarget._id, {
        onSuccess: () => setToggleTarget(null),
      });
    } else {
      reactivatePart.mutate(
        { id: toggleTarget._id, data: { isActive: true } },
        { onSuccess: () => setToggleTarget(null) }
      );
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
      <PageHeader
        title="Suku Cadang"
        description="Kelola stok gudang, tambah stok masuk (restock), dan pantau riwayat mutasi."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-md border bg-muted/40 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setFilterMode("all")}
                className={`rounded px-2.5 py-1 font-medium transition ${
                  filterMode === "all"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setFilterMode("low-stock")}
                className={`rounded px-2.5 py-1 font-medium transition ${
                  filterMode === "low-stock"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Stok Menipis
              </button>
            </div>
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-1 h-4 w-4" />
              Suku Cadang Baru
            </Button>
          </div>
        }
      />

      <div className="mt-8">
        {activeQuery.isLoading ? (
          <TableSkeleton rows={5} columns={6} />
        ) : activeQuery.isError ? (
          <ErrorState
            message={
              activeQuery.error instanceof Error
                ? activeQuery.error.message
                : undefined
            }
            onRetry={() => activeQuery.refetch()}
          />
        ) : parts.length === 0 ? (
          <EmptyState
            title={
              filterMode === "low-stock"
                ? "Tidak ada suku cadang yang menipis"
                : "Belum ada suku cadang"
            }
            description={
              filterMode === "low-stock"
                ? "Seluruh suku cadang aktif berada di atas batas minimum."
                : "Tambahkan suku cadang pertama untuk mulai mengelola stok."
            }
          />
        ) : (
          <DataTable
            columns={[
              {
                key: "code",
                header: "Kode",
                cell: (part) => (
                  <span className="font-mono text-xs">{part.code}</span>
                ),
              },
              { key: "name", header: "Nama", cell: (part) => part.name },
              {
                key: "stock",
                header: "Stok",
                cell: (part) => (
                  <span className="flex items-center gap-2">
                    {part.stock} {part.unit}
                    {part.isActive && isLowStock(part) && (
                      <Indicator tone="danger">Menipis</Indicator>
                    )}
                  </span>
                ),
              },
              {
                key: "minStock",
                header: "Min",
                cell: (part) => part.minStock,
              },
              {
                key: "price",
                header: "Harga",
                cell: (part) => formatRupiah(part.price),
              },
              {
                key: "status",
                header: "Status",
                cell: (part) =>
                  part.isActive ? (
                    <Indicator tone="success">Aktif</Indicator>
                  ) : (
                    <Indicator tone="muted">Nonaktif</Indicator>
                  ),
              },
              {
                key: "actions",
                header: "",
                className: "text-right",
                cell: (part) => (
                  <div className="flex flex-wrap items-center justify-end gap-1">
                    {part.isActive && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setRestocking(part)}
                      >
                        <PackagePlus className="mr-1 h-4 w-4" />
                        Restock
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setHistoryPart(part)}
                    >
                      <History className="mr-1 h-4 w-4" />
                      Mutasi
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditing(part)}
                    >
                      <Pencil className="mr-1 h-4 w-4" />
                      Ubah
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setToggleTarget(part)}
                    >
                      {part.isActive ? "Nonaktifkan" : "Aktifkan"}
                    </Button>
                  </div>
                ),
              },
            ]}
            rows={parts}
            getRowId={(part) => part._id}
          />
        )}
      </div>

      <CreatePartDialog open={createOpen} onOpenChange={setCreateOpen} />
      <EditPartDialog part={editing} onClose={() => setEditing(null)} />
      <RestockPartDialog
        part={restocking}
        onClose={() => setRestocking(null)}
      />
      <PartMovementsDialog
        key={historyPart?._id ?? "closed"}
        part={historyPart}
        onClose={() => setHistoryPart(null)}
      />
      <ConfirmDialog
        open={Boolean(toggleTarget)}
        onOpenChange={(value) => !value && setToggleTarget(null)}
        title={
          toggleTarget?.isActive
            ? "Nonaktifkan suku cadang?"
            : "Aktifkan suku cadang?"
        }
        description={
          toggleTarget
            ? toggleTarget.isActive
              ? `${toggleTarget.name} (${toggleTarget.code}) akan disembunyikan dari pilihan suku cadang tiket baru.`
              : `${toggleTarget.name} (${toggleTarget.code}) akan kembali tersedia di katalog suku cadang aktif.`
            : undefined
        }
        confirmLabel={toggleTarget?.isActive ? "Nonaktifkan" : "Aktifkan"}
        destructive={toggleTarget?.isActive ?? false}
        loading={togglePending}
        onConfirm={handleConfirmToggle}
      />
    </main>
  );
}

function CreatePartDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const createPart = useCreatePart();
  const form = useForm<PartFormValues>({
    resolver: zodResolver(partFormSchema),
    defaultValues: {
      code: "",
      name: "",
      stock: "0",
      minStock: "0",
      price: "0",
      unit: "",
    },
  });

  // Reset the form each time the dialog opens so stale values never linger.
  React.useEffect(() => {
    if (open) form.reset();
  }, [open, form]);

  const onSubmit = form.handleSubmit((values) => {
    createPart.mutate(toPartPayload(values), {
      onSuccess: () => onOpenChange(false),
      onError: (error) =>
        applyApiFieldErrors(error, form.setError, KNOWN_FIELDS),
    });
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Suku Cadang Baru</DialogTitle>
          <DialogDescription>
            Kode akan otomatis diubah menjadi huruf kapital.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            <FormField control={form.control} name="code" label="Kode" placeholder="OIL-001" />
            <FormField control={form.control} name="name" label="Nama" placeholder="Oli Mesin" />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="stock" label="Stok" type="number" />
              <FormField control={form.control} name="minStock" label="Stok minimal" type="number" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="price" label="Harga" type="number" />
              <FormField control={form.control} name="unit" label="Satuan" placeholder="botol" />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={createPart.isPending}
              >
                Batal
              </Button>
              <Button type="submit" disabled={createPart.isPending}>
                {createPart.isPending ? "Menyimpan..." : "Simpan"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function EditPartDialog({
  part,
  onClose,
}: {
  part: Part | null;
  onClose: () => void;
}) {
  const updatePart = useUpdatePart();
  const form = useForm<PartFormValues>({
    resolver: zodResolver(partFormSchema),
    defaultValues: {
      code: "",
      name: "",
      stock: "0",
      minStock: "0",
      price: "0",
      unit: "",
    },
  });

  React.useEffect(() => {
    if (part) {
      form.reset({
        code: part.code,
        name: part.name,
        stock: String(part.stock),
        minStock: String(part.minStock),
        price: String(part.price),
        unit: part.unit,
      });
    }
  }, [part, form]);

  const onSubmit = form.handleSubmit((values) => {
    if (!part) return;
    updatePart.mutate(
      { id: part._id, data: toPartPayload(values) },
      {
        onSuccess: () => onClose(),
        onError: (error) =>
          applyApiFieldErrors(error, form.setError, KNOWN_FIELDS),
      }
    );
  });

  return (
    <Dialog open={Boolean(part)} onOpenChange={(value) => !value && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ubah Suku Cadang</DialogTitle>
          <DialogDescription>
            Perbarui detail, harga, atau koreksi stok (stock opname). Untuk
            penambahan stok masuk reguler, gunakan tombol Restock.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            <FormField control={form.control} name="code" label="Kode" />
            <FormField control={form.control} name="name" label="Nama" />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="stock" label="Stok (Opname)" type="number" />
              <FormField control={form.control} name="minStock" label="Stok minimal" type="number" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="price" label="Harga" type="number" />
              <FormField control={form.control} name="unit" label="Satuan" />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={updatePart.isPending}
              >
                Batal
              </Button>
              <Button type="submit" disabled={updatePart.isPending}>
                {updatePart.isPending ? "Menyimpan..." : "Simpan"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function RestockPartDialog({
  part,
  onClose,
}: {
  part: Part | null;
  onClose: () => void;
}) {
  const restockPart = useRestockPart();
  const form = useForm<RestockPartFormValues>({
    resolver: zodResolver(restockPartFormSchema),
    defaultValues: {
      quantity: "1",
      note: "",
    },
  });

  React.useEffect(() => {
    if (part) {
      form.reset({
        quantity: "1",
        note: "",
      });
    }
  }, [part, form]);

  const onSubmit = form.handleSubmit((values) => {
    if (!part) return;
    const note = values.note?.trim();
    restockPart.mutate(
      {
        id: part._id,
        data: {
          quantity: Number(values.quantity),
          ...(note ? { note } : {}),
        },
      },
      {
        onSuccess: () => onClose(),
        onError: (error) =>
          applyApiFieldErrors(error, form.setError, RESTOCK_KNOWN_FIELDS),
      }
    );
  });

  return (
    <Dialog open={Boolean(part)} onOpenChange={(value) => !value && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Restock {part?.name}</DialogTitle>
          <DialogDescription>
            Stok saat ini:{" "}
            <span className="font-medium text-foreground">
              {part?.stock} {part?.unit}
            </span>{" "}
            (minimum {part?.minStock} {part?.unit}). Penambahan ini tercatat
            otomatis sebagai mutasi masuk (restock).
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="quantity"
              label={`Jumlah tambahan (${part?.unit ?? "unit"})`}
              type="number"
            />
            <FormField
              control={form.control}
              name="note"
              label="Catatan (opsional)"
              placeholder="Contoh: Kiriman supplier AHM"
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={restockPart.isPending}
              >
                Batal
              </Button>
              <Button type="submit" disabled={restockPart.isPending}>
                {restockPart.isPending ? "Menambahkan..." : "Tambah Stok"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function movementTypeLabel(type: StockMovementType): string {
  const labels: Record<StockMovementType, string> = {
    restock: "Restock",
    usage: "Pemakaian Servis",
    return: "Pengembalian",
    adjust: "Koreksi Opname",
  };
  return labels[type];
}

function movementTone(
  type: StockMovementType
): "success" | "danger" | "warning" | "muted" {
  if (type === "restock" || type === "return") return "success";
  if (type === "usage") return "warning";
  return "muted";
}

function actorLabel(movement: StockMovement): string {
  const ref = movement.userId;
  if (ref && typeof ref !== "string") {
    return `${ref.name} (${ref.role})`;
  }
  return "-";
}

function bookingLabel(movement: StockMovement): string | null {
  const ref = movement.bookingId;
  if (ref && typeof ref !== "string") {
    return ref.bookingNumber;
  }
  return null;
}

function PartMovementsDialog({
  part,
  onClose,
}: {
  part: Part | null;
  onClose: () => void;
}) {
  const [typeFilter, setTypeFilter] = React.useState<string>("all");

  const query = usePartMovements(
    part?._id,
    {
      ...(typeFilter !== "all"
        ? { type: typeFilter as StockMovementType }
        : {}),
      limit: 50,
    },
    Boolean(part)
  );

  const movements = query.data?.data ?? [];

  return (
    <Dialog open={Boolean(part)} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Riwayat Mutasi Stok · {part?.name}</DialogTitle>
          <DialogDescription>
            Kode <span className="font-mono">{part?.code}</span> · Stok saat
            ini:{" "}
            <span className="font-medium text-foreground">
              {part?.stock} {part?.unit}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">
            Filter jenis mutasi:
          </span>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Semua jenis" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua jenis</SelectItem>
              <SelectItem value="restock">Restock</SelectItem>
              <SelectItem value="usage">Pemakaian Servis</SelectItem>
              <SelectItem value="return">Pengembalian</SelectItem>
              <SelectItem value="adjust">Koreksi Opname</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {query.isLoading ? (
            <TableSkeleton rows={4} columns={5} />
          ) : query.isError ? (
            <ErrorState
              message={
                query.error instanceof Error ? query.error.message : undefined
              }
              onRetry={() => query.refetch()}
            />
          ) : movements.length === 0 ? (
            <EmptyState
              title="Belum ada riwayat mutasi"
              description="Mutasi stok akan tercatat saat restock, pemakaian servis, pengembalian, atau koreksi opname."
            />
          ) : (
            <DataTable
              columns={[
                {
                  key: "createdAt",
                  header: "Waktu (WIB)",
                  cell: (m) => (
                    <span className="text-xs">
                      {formatDateTime(m.createdAt)}
                    </span>
                  ),
                },
                {
                  key: "type",
                  header: "Jenis",
                  cell: (m) => (
                    <Indicator tone={movementTone(m.type)}>
                      {movementTypeLabel(m.type)}
                    </Indicator>
                  ),
                },
                {
                  key: "quantity",
                  header: "Perubahan",
                  cell: (m) => (
                    <span
                      className={`font-mono text-xs font-semibold ${
                        m.quantity > 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-destructive"
                      }`}
                    >
                      {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                    </span>
                  ),
                },
                {
                  key: "stockAfter",
                  header: "Stok Akhir",
                  cell: (m) => (
                    <span className="font-mono text-xs">
                      {m.stockAfter} {part?.unit}
                    </span>
                  ),
                },
                {
                  key: "note",
                  header: "Keterangan / Petugas",
                  cell: (m) => {
                    const ticket = bookingLabel(m);
                    return (
                      <div className="space-y-0.5 text-xs">
                        <div>
                          {ticket && (
                            <span className="mr-1.5 font-mono font-medium">
                              [{ticket}]
                            </span>
                          )}
                          <span>{m.note ?? "-"}</span>
                        </div>
                        <div className="text-muted-foreground">
                          Oleh: {actorLabel(m)}
                        </div>
                      </div>
                    );
                  },
                },
              ]}
              rows={movements}
              getRowId={(m) => m._id}
            />
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
