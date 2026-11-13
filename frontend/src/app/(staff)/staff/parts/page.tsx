"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus } from "lucide-react";

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
import { Form } from "@/components/ui/form";
import { FormField } from "@/components/form-field";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { TableSkeleton } from "@/components/loading-state";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useParts } from "@/hooks/use-queries";
import {
  useCreatePart,
  useDeletePart,
  useUpdatePart,
} from "@/hooks/use-mutations";
import { applyApiFieldErrors } from "@/lib/form-errors";
import { formatRupiah } from "@/lib/format";
import { partFormSchema, type PartFormValues } from "@/lib/validations";
import type { Part } from "@/types/api";

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

function isLowStock(part: Part): boolean {
  return part.isLowStock ?? part.stock <= part.minStock;
}

export default function StaffPartsPage() {
  const { data, isLoading, isError, error, refetch } = useParts({
    includeInactive: true,
  });
  const parts = data ?? [];

  const [createOpen, setCreateOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Part | null>(null);
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
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <PageHeader
        title="Suku Cadang"
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-1 h-4 w-4" />
            Suku Cadang Baru
          </Button>
        }
      />

      <div className="mt-8">
        {isLoading ? (
          <TableSkeleton rows={5} columns={6} />
        ) : isError ? (
          <ErrorState
            message={error instanceof Error ? error.message : undefined}
            onRetry={() => refetch()}
          />
        ) : parts.length === 0 ? (
          <EmptyState
            title="Belum ada suku cadang"
            description="Tambahkan suku cadang pertama untuk mulai mengelola stok."
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
                  <div className="flex items-center justify-end gap-1">
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
            Perbarui stok (restock) dan harga suku cadang.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            <FormField control={form.control} name="code" label="Kode" />
            <FormField control={form.control} name="name" label="Nama" />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="stock" label="Stok" type="number" />
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
