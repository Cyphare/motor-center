"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertTriangle, Pencil, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import { useParts } from "@/hooks/use-queries";
import { useCreatePart, useUpdatePart } from "@/hooks/use-mutations";
import { applyApiFieldErrors } from "@/lib/form-errors";
import { formatRupiah } from "@/lib/format";
import type { Part } from "@/types/api";

// Non-negative integer entered as a string (number <input>), validated and
// later converted to a number on submit. Keeps the react-hook-form field type
// a plain string, matching the project's existing form pattern.
const intString = (label: string) =>
  z
    .string()
    .min(1, `${label} wajib diisi`)
    .refine((value) => {
      const n = Number(value);
      return Number.isInteger(n) && n >= 0;
    }, `${label} harus bilangan bulat tidak negatif`);

// Mirrors backend/src/validations/catalog.validation.ts part schema.
const partSchema = z.object({
  code: z.string().trim().min(1, "Kode wajib diisi").max(50),
  name: z.string().trim().min(1, "Nama wajib diisi").max(100),
  stock: intString("Stok"),
  minStock: intString("Stok minimal"),
  price: intString("Harga"),
  unit: z.string().trim().min(1, "Satuan wajib diisi").max(30),
});

type PartValues = z.infer<typeof partSchema>;

function toPartPayload(values: PartValues) {
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
  const parts = data?.data ?? [];

  const [createOpen, setCreateOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Part | null>(null);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <PageHeader
        title="Suku Cadang"
        description="Kelola stok dan harga suku cadang bengkel."
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-1 h-4 w-4" />
            Suku Cadang Baru
          </Button>
        }
      />

      <div className="mt-8">
        {isLoading ? (
          <TableSkeleton rows={5} columns={5} />
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
                    {isLowStock(part) && (
                      <Badge
                        variant="outline"
                        className="border-red-200 bg-red-50 text-red-700"
                      >
                        <AlertTriangle className="mr-1 h-3 w-3" />
                        Stok menipis
                      </Badge>
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
                key: "actions",
                header: "",
                className: "text-right",
                cell: (part) => (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditing(part)}
                  >
                    <Pencil className="mr-1 h-4 w-4" />
                    Ubah
                  </Button>
                ),
              },
            ]}
            rows={parts}
            getRowId={(part) => part._id}
          />
        )}
      </div>

      <CreatePartDialog open={createOpen} onOpenChange={setCreateOpen} />
      <EditPartDialog
        part={editing}
        onClose={() => setEditing(null)}
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
  const form = useForm<PartValues>({
    resolver: zodResolver(partSchema),
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
  const form = useForm<PartValues>({
    resolver: zodResolver(partSchema),
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
