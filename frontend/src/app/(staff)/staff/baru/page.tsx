"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { useMechanics, useServices } from "@/hooks/use-queries";
import { useCreateBooking } from "@/hooks/use-mutations";
import { applyApiFieldErrors } from "@/lib/form-errors";
import { formatRupiah } from "@/lib/format";
import {
  createWalkInBookingFormSchema,
  type CreateWalkInBookingFormValues,
} from "@/lib/validations";

const NONE = "__none__";

const KNOWN_FIELDS = [
  "customerName",
  "customerPhone",
  "plateNumber",
  "motorModel",
  "complaint",
  "serviceId",
  "mechanicId",
  "serviceFee",
] as const;

export default function NewWalkInPage() {
  const router = useRouter();
  const createBooking = useCreateBooking();
  const { data: servicesData } = useServices();
  const { data: mechanicsData } = useMechanics();
  const services = servicesData ?? [];
  const mechanics = mechanicsData ?? [];

  const form = useForm<CreateWalkInBookingFormValues>({
    resolver: zodResolver(createWalkInBookingFormSchema),
    defaultValues: {
      customerName: "",
      customerPhone: "",
      plateNumber: "",
      motorModel: "",
      complaint: "",
      serviceId: "",
      mechanicId: "",
      serviceFee: "",
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    const payload = {
      customerName: values.customerName.trim(),
      customerPhone: values.customerPhone.trim(),
      plateNumber: values.plateNumber.trim(),
      motorModel: values.motorModel.trim(),
      complaint: values.complaint.trim(),
      ...(values.serviceId && values.serviceId !== NONE
        ? { serviceId: values.serviceId }
        : {}),
      ...(values.mechanicId && values.mechanicId !== NONE
        ? { mechanicId: values.mechanicId }
        : {}),
      ...(values.serviceFee && values.serviceFee.trim() !== ""
        ? { serviceFee: Number(values.serviceFee) }
        : {}),
    };

    createBooking.mutate(
      { type: "walk-in", data: payload },
      {
        onSuccess: (booking) => {
          router.replace(`/staff/${booking._id}`);
        },
        onError: (error) => {
          applyApiFieldErrors(error, form.setError, KNOWN_FIELDS);
        },
      }
    );
  });

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <PageHeader
        title="Tiket Walk-in Baru"
        description="Buat tiket untuk pelanggan yang datang langsung ke bengkel."
      />

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-lg">Detail Pelanggan & Servis</CardTitle>
          <CardDescription>
            Tiket baru akan masuk dengan status Antre.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={onSubmit}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="customerName"
                label="Nama pelanggan"
                placeholder="Budi Santoso"
              />
              <FormField
                control={form.control}
                name="customerPhone"
                label="Nomor telepon"
                placeholder="081234567890"
              />
              <FormField
                control={form.control}
                name="plateNumber"
                label="Nomor plat"
                placeholder="B 1234 ABC"
              />
              <FormField
                control={form.control}
                name="motorModel"
                label="Model motor"
                placeholder="Honda Vario 125"
              />
              <FormField
                control={form.control}
                name="complaint"
                label="Keluhan"
                placeholder="Mesin terasa kasar saat digas"
              />
              <FormField
                control={form.control}
                name="serviceId"
                label="Layanan (opsional)"
                render={(field) => (
                  <Select
                    value={field.value || NONE}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih layanan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>Tanpa layanan tertentu</SelectItem>
                      {services.map((service) => (
                        <SelectItem key={service._id} value={service._id}>
                          {service.name} ({formatRupiah(service.estimatedPrice)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FormField
                control={form.control}
                name="mechanicId"
                label="Mekanik (opsional)"
                render={(field) => (
                  <Select
                    value={field.value || NONE}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih mekanik" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>Belum ditugaskan</SelectItem>
                      {mechanics.map((mechanic) => (
                        <SelectItem key={mechanic._id} value={mechanic._id}>
                          {mechanic.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FormField
                control={form.control}
                name="serviceFee"
                label="Biaya jasa (opsional)"
                type="number"
                placeholder="0"
              />
            </CardContent>
            <CardFooter className="flex items-center justify-end gap-2">
              <Button asChild variant="ghost">
                <Link href="/staff">Batal</Link>
              </Button>
              <Button type="submit" disabled={createBooking.isPending}>
                {createBooking.isPending ? "Memproses..." : "Buat Tiket"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </main>
  );
}
