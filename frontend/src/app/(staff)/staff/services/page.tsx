"use client";

import * as React from "react";
import { useForm, type Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Pencil, Plus } from "lucide-react";

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
import { useServices } from "@/hooks/use-queries";
import { useCreateService, useUpdateService } from "@/hooks/use-mutations";
import { applyApiFieldErrors } from "@/lib/form-errors";
import { formatRupiah } from "@/lib/format";
import type { Service } from "@/types/api";

// Mirrors backend/src/validations/catalog.validation.ts service schema.
// Numeric fields stay strings in the form (number <input>) and convert on
// submit, matching the project's existing form pattern.
const serviceSchema = z.object({
  name: z.string().trim().min(1, "Nama wajib diisi").max(100),
  description: z.string().trim().min(1, "Deskripsi wajib diisi").max(1000),
  estimatedPrice: z
    .string()
    .min(1, "Harga wajib diisi")
    .refine((value) => {
      const n = Number(value);
      return Number.isInteger(n) && n >= 0;
    }, "Harga harus bilangan bulat tidak negatif"),
  estimatedDurationMinutes: z
    .string()
    .min(1, "Durasi wajib diisi")
    .refine((value) => {
      const n = Number(value);
      return Number.isInteger(n) && n > 0;
    }, "Durasi harus bilangan bulat lebih dari 0"),
});

type ServiceValues = z.infer<typeof serviceSchema>;

function toServicePayload(values: ServiceValues) {
  return {
    name: values.name.trim(),
    description: values.description.trim(),
    estimatedPrice: Number(values.estimatedPrice),
    estimatedDurationMinutes: Number(values.estimatedDurationMinutes),
  };
}

const KNOWN_FIELDS = [
  "name",
  "description",
  "estimatedPrice",
  "estimatedDurationMinutes",
] as const;

export default function StaffServicesPage() {
  const { data, isLoading, isError, error, refetch } = useServices({
    includeInactive: true,
  });
  const services = data?.data ?? [];

  const [createOpen, setCreateOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Service | null>(null);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <PageHeader
        title="Layanan"
        description="Kelola katalog layanan servis bengkel."
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-1 h-4 w-4" />
            Layanan Baru
          </Button>
        }
      />

      <div className="mt-8">
        {isLoading ? (
          <TableSkeleton rows={5} columns={4} />
        ) : isError ? (
          <ErrorState
            message={error instanceof Error ? error.message : undefined}
            onRetry={() => refetch()}
          />
        ) : services.length === 0 ? (
          <EmptyState
            title="Belum ada layanan"
            description="Tambahkan layanan pertama untuk ditampilkan di katalog."
          />
        ) : (
          <DataTable
            columns={[
              { key: "name", header: "Nama", cell: (service) => service.name },
              {
                key: "price",
                header: "Estimasi harga",
                cell: (service) => formatRupiah(service.estimatedPrice),
              },
              {
                key: "duration",
                header: "Durasi",
                cell: (service) => `${service.estimatedDurationMinutes} menit`,
              },
              {
                key: "actions",
                header: "",
                className: "text-right",
                cell: (service) => (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditing(service)}
                  >
                    <Pencil className="mr-1 h-4 w-4" />
                    Ubah
                  </Button>
                ),
              },
            ]}
            rows={services}
            getRowId={(service) => service._id}
          />
        )}
      </div>

      <CreateServiceDialog open={createOpen} onOpenChange={setCreateOpen} />
      <EditServiceDialog service={editing} onClose={() => setEditing(null)} />
    </main>
  );
}

function ServiceFormFields({
  control,
}: {
  control: Control<ServiceValues>;
}) {
  return (
    <>
      <FormField control={control} name="name" label="Nama" placeholder="Servis Rutin" />
      <FormField
        control={control}
        name="description"
        label="Deskripsi"
        placeholder="Ganti oli, cek rem, dan penyetelan"
      />
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={control}
          name="estimatedPrice"
          label="Estimasi harga"
          type="number"
        />
        <FormField
          control={control}
          name="estimatedDurationMinutes"
          label="Durasi (menit)"
          type="number"
        />
      </div>
    </>
  );
}

function CreateServiceDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const createService = useCreateService();
  const form = useForm<ServiceValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: "",
      description: "",
      estimatedPrice: "0",
      estimatedDurationMinutes: "30",
    },
  });

  React.useEffect(() => {
    if (open) form.reset();
  }, [open, form]);

  const onSubmit = form.handleSubmit((values) => {
    createService.mutate(toServicePayload(values), {
      onSuccess: () => onOpenChange(false),
      onError: (error) =>
        applyApiFieldErrors(error, form.setError, KNOWN_FIELDS),
    });
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Layanan Baru</DialogTitle>
          <DialogDescription>
            Layanan baru langsung tampil di katalog publik.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            <ServiceFormFields control={form.control} />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={createService.isPending}
              >
                Batal
              </Button>
              <Button type="submit" disabled={createService.isPending}>
                {createService.isPending ? "Menyimpan..." : "Simpan"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function EditServiceDialog({
  service,
  onClose,
}: {
  service: Service | null;
  onClose: () => void;
}) {
  const updateService = useUpdateService();
  const form = useForm<ServiceValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: "",
      description: "",
      estimatedPrice: "0",
      estimatedDurationMinutes: "30",
    },
  });

  React.useEffect(() => {
    if (service) {
      form.reset({
        name: service.name,
        description: service.description,
        estimatedPrice: String(service.estimatedPrice),
        estimatedDurationMinutes: String(service.estimatedDurationMinutes),
      });
    }
  }, [service, form]);

  const onSubmit = form.handleSubmit((values) => {
    if (!service) return;
    updateService.mutate(
      { id: service._id, data: toServicePayload(values) },
      {
        onSuccess: () => onClose(),
        onError: (error) =>
          applyApiFieldErrors(error, form.setError, KNOWN_FIELDS),
      }
    );
  });

  return (
    <Dialog
      open={Boolean(service)}
      onOpenChange={(value) => !value && onClose()}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ubah Layanan</DialogTitle>
          <DialogDescription>Perbarui detail layanan.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            <ServiceFormFields control={form.control} />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={updateService.isPending}
              >
                Batal
              </Button>
              <Button type="submit" disabled={updateService.isPending}>
                {updateService.isPending ? "Menyimpan..." : "Simpan"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
