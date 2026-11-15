"use client";

import * as React from "react";
import { useForm, type Control } from "react-hook-form";
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
import { useServices } from "@/hooks/use-queries";
import {
  useCreateService,
  useDeleteService,
  useUpdateService,
} from "@/hooks/use-mutations";
import { applyApiFieldErrors } from "@/lib/form-errors";
import { formatRupiah } from "@/lib/format";
import { serviceFormSchema, type ServiceFormValues } from "@/lib/validations";
import type { Service } from "@/types/api";

function toServicePayload(values: ServiceFormValues) {
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
  const services = data ?? [];

  const [createOpen, setCreateOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Service | null>(null);
  const [toggleTarget, setToggleTarget] = React.useState<Service | null>(null);

  const deleteService = useDeleteService();
  const reactivateService = useUpdateService();
  const togglePending = deleteService.isPending || reactivateService.isPending;

  function handleConfirmToggle() {
    if (!toggleTarget) return;
    if (toggleTarget.isActive) {
      deleteService.mutate(toggleTarget._id, {
        onSuccess: () => setToggleTarget(null),
      });
    } else {
      reactivateService.mutate(
        { id: toggleTarget._id, data: { isActive: true } },
        { onSuccess: () => setToggleTarget(null) }
      );
    }
  }

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <PageHeader
        title="Layanan"
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-1 h-4 w-4" />
            Layanan Baru
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
                key: "status",
                header: "Status",
                cell: (service) =>
                  service.isActive ? (
                    <Indicator tone="success">Aktif</Indicator>
                  ) : (
                    <Indicator tone="muted">Nonaktif</Indicator>
                  ),
              },
              {
                key: "actions",
                header: "",
                className: "text-right",
                cell: (service) => (
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditing(service)}
                    >
                      <Pencil className="mr-1 h-4 w-4" />
                      Ubah
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setToggleTarget(service)}
                    >
                      {service.isActive ? "Nonaktifkan" : "Aktifkan"}
                    </Button>
                  </div>
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
      <ConfirmDialog
        open={Boolean(toggleTarget)}
        onOpenChange={(value) => !value && setToggleTarget(null)}
        title={
          toggleTarget?.isActive
            ? "Nonaktifkan layanan?"
            : "Aktifkan layanan?"
        }
        description={
          toggleTarget
            ? toggleTarget.isActive
              ? `${toggleTarget.name} akan disembunyikan dari katalog publik dan pilihan booking baru.`
              : `${toggleTarget.name} akan kembali tampil di katalog publik.`
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

function ServiceFormFields({
  control,
}: {
  control: Control<ServiceFormValues>;
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
  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
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
  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
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
