"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail } from "lucide-react";

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
import { useAuth } from "@/hooks/use-auth";
import { useServices } from "@/hooks/use-queries";
import { useCreateBooking } from "@/hooks/use-mutations";
import { applyApiFieldErrors } from "@/lib/form-errors";
import { formatRupiah } from "@/lib/format";
import {
  createOnlineBookingFormSchema,
  type CreateOnlineBookingFormValues,
} from "@/lib/validations";

const NO_SERVICE = "__none__";

const KNOWN_FIELDS = [
  "plateNumber",
  "motorModel",
  "complaint",
  "serviceId",
  "serviceDate",
] as const;

export default function NewBookingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const createBooking = useCreateBooking();
  const { data: servicesData } = useServices();
  const services = servicesData ?? [];

  const form = useForm<CreateOnlineBookingFormValues>({
    resolver: zodResolver(createOnlineBookingFormSchema),
    defaultValues: {
      plateNumber: "",
      motorModel: "",
      complaint: "",
      serviceId: "",
      serviceDate: "",
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    const payload = {
      plateNumber: values.plateNumber.trim(),
      motorModel: values.motorModel.trim(),
      complaint: values.complaint.trim(),
      ...(values.serviceId && values.serviceId !== NO_SERVICE
        ? { serviceId: values.serviceId }
        : {}),
      ...(values.serviceDate
        ? { serviceDate: new Date(values.serviceDate).toISOString() }
        : {}),
    };

    createBooking.mutate(
      { type: "online", data: payload },
      {
        onSuccess: (booking) => {
          router.replace(`/pelanggan/${booking._id}`);
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
        title="Pesan Servis Online"
        description="Isi detail kendaraan dan keluhan Anda. Tiket akan masuk dengan status Antre."
      />

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-lg">Detail Servis</CardTitle>
          <CardDescription>
            Konfirmasi pesanan akan dikirim ke email akun Anda.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={onSubmit}>
            <CardContent className="space-y-4">
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
                    value={field.value || NO_SERVICE}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih layanan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_SERVICE}>
                        Tanpa layanan tertentu
                      </SelectItem>
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
                name="serviceDate"
                label="Tanggal servis (opsional)"
                type="datetime-local"
              />
            </CardContent>
            <CardFooter className="flex flex-col items-stretch gap-4">
              <div className="flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
                <Mail className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  Email konfirmasi akan dikirim ke
                  {user?.email ? ` ${user.email}` : " alamat email akun Anda"}{" "}
                  setelah pesanan dibuat.
                </span>
              </div>
              <div className="flex items-center justify-end gap-2">
                <Button asChild variant="ghost">
                  <Link href="/pelanggan">Batal</Link>
                </Button>
                <Button type="submit" disabled={createBooking.isPending}>
                  {createBooking.isPending ? "Memproses..." : "Pesan Servis"}
                </Button>
              </div>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </main>
  );
}
