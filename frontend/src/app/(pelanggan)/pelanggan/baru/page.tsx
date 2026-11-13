"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronLeft, ChevronRight, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { FormField } from "@/components/form-field";
import { PageHeader } from "@/components/page-header";
import { PlateNumber } from "@/components/plate-number";
import { LoadingState } from "@/components/loading-state";
import { useAuth } from "@/hooks/use-auth";
import { useOwnBookings, useServices } from "@/hooks/use-queries";
import { useCreateBooking } from "@/hooks/use-mutations";
import { ApiRequestError } from "@/lib/api-client";
import { applyApiFieldErrors } from "@/lib/form-errors";
import { formatDate, formatRupiah } from "@/lib/format";
import { groupByPlate, normalizePlate, plateKey } from "@/lib/derive";
import {
  WIZARD_STEPS,
  jakartaToday,
  serviceDateToIso,
  stepForFields,
} from "@/lib/booking-wizard";
import { cn } from "@/lib/utils";
import {
  createOnlineBookingFormSchema,
  type CreateOnlineBookingFormValues,
} from "@/lib/validations";
import type { Service } from "@/types/api";

const KNOWN_FIELDS = [
  "plateNumber",
  "motorModel",
  "complaint",
  "serviceId",
  "serviceDate",
] as const;

function formatDuration(minutes: number): string {
  if (!minutes || minutes <= 0) return "-";
  if (minutes < 60) return `${minutes} mnt`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} jam` : `${hours} j ${rest} mnt`;
}

export default function NewBookingPage() {
  return (
    <React.Suspense fallback={<LoadingState className="flex-1" />}>
      <BookingWizard />
    </React.Suspense>
  );
}

function BookingWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const createBooking = useCreateBooking();
  const { data: servicesData, isLoading: servicesLoading } = useServices();
  const services = (servicesData ?? []).filter((s) => s.isActive !== false);
  const { data: ownData } = useOwnBookings();
  const motors = React.useMemo(
    () => groupByPlate(ownData?.data ?? []),
    [ownData]
  );

  const [step, setStep] = React.useState(0);
  const headingRef = React.useRef<HTMLHeadingElement>(null);

  const form = useForm<CreateOnlineBookingFormValues>({
    resolver: zodResolver(createOnlineBookingFormSchema),
    defaultValues: {
      plateNumber: searchParams?.get("plate") ?? "",
      motorModel: "",
      complaint: "",
      serviceId: searchParams?.get("serviceId") ?? "",
      serviceDate: "",
    },
  });

  const values = useWatch({ control: form.control });
  const selectedService = services.find((s) => s._id === values.serviceId);

  // Prefill the motor model once history loads for a plate passed via ?plate=
  // or a single known motor, without overwriting what the user typed.
  React.useEffect(() => {
    if (motors.length === 0) return;
    const { plateNumber, motorModel } = form.getValues();
    if (motorModel) return;
    const match = plateNumber
      ? motors.find((m) => plateKey(m.plateNumber) === plateKey(plateNumber))
      : motors.length === 1
        ? motors[0]
        : undefined;
    if (match) {
      form.setValue("plateNumber", match.plateNumber);
      form.setValue("motorModel", match.motorModel);
    }
  }, [motors, form]);

  // Move focus to the step heading on every step change (not on first load)
  // so keyboard and screen-reader users land on the new content.
  const firstRender = React.useRef(true);
  React.useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [step]);

  const goTo = setStep;

  const next = async () => {
    const fields = WIZARD_STEPS[step].fields;
    const ok = fields.length === 0 || (await form.trigger([...fields]));
    if (ok) goTo(Math.min(step + 1, WIZARD_STEPS.length - 1));
  };

  const onSubmit = form.handleSubmit(
    (formValues) => {
      const serviceDate = formValues.serviceDate
        ? serviceDateToIso(formValues.serviceDate)
        : undefined;
      const payload = {
        plateNumber: normalizePlate(formValues.plateNumber),
        motorModel: formValues.motorModel.trim(),
        complaint: formValues.complaint.trim(),
        ...(formValues.serviceId ? { serviceId: formValues.serviceId } : {}),
        ...(serviceDate ? { serviceDate } : {}),
      };

      createBooking.mutate(
        { type: "online", data: payload },
        {
          onSuccess: (booking) => {
            router.replace(`/pelanggan/${booking._id}?baru=1`);
          },
          onError: (error) => {
            applyApiFieldErrors(error, form.setError, KNOWN_FIELDS);
            if (error instanceof ApiRequestError && error.fieldErrors.length) {
              goTo(
                stepForFields(
                  error.fieldErrors.map((f) => f.field.replace(/^body\./, ""))
                )
              );
            }
          },
        }
      );
    },
    (errors) => goTo(stepForFields(Object.keys(errors)))
  );

  const isLast = step === WIZARD_STEPS.length - 1;
  const current = WIZARD_STEPS[step];

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 sm:px-6">
      <PageHeader title="Pesan Servis" />

      <WizardProgress step={step} onSelect={(i) => i < step && goTo(i)} />

      <Form {...form}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (isLast) void onSubmit(e);
            else void next();
          }}
          className="mt-6 space-y-6"
          noValidate
        >
          <h2
            ref={headingRef}
            tabIndex={-1}
            className="font-display text-xl font-bold outline-none"
          >
            {step + 1}. {current.label}
          </h2>

          {current.id === "layanan" && (
            <ServicePicker
              services={services}
              loading={servicesLoading}
              value={values.serviceId ?? ""}
              onChange={(id) => form.setValue("serviceId", id)}
            />
          )}

          {current.id === "motor" && (
            <div className="space-y-4">
              {motors.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Motor Saya</p>
                  <div className="flex flex-wrap gap-2">
                    {motors.map((motor) => {
                      const selected =
                        plateKey(motor.plateNumber) ===
                        plateKey(values.plateNumber ?? "");
                      return (
                        <button
                          key={motor.plateNumber}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => {
                            form.setValue("plateNumber", motor.plateNumber, {
                              shouldValidate: true,
                            });
                            form.setValue("motorModel", motor.motorModel, {
                              shouldValidate: true,
                            });
                          }}
                          className={cn(
                            "flex items-center gap-2 border px-3 py-2 text-left text-sm transition-colors hover:bg-muted/60",
                            selected && "border-primary bg-primary/10"
                          )}
                        >
                          <PlateNumber plate={motor.plateNumber} size="sm" />
                          <span>{motor.motorModel}</span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Pilih motor yang pernah diservis, atau isi motor lain di bawah.
                  </p>
                </div>
              )}
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
            </div>
          )}

          {current.id === "jadwal" && (
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="serviceDate"
                label="Tanggal datang (opsional)"
                description="Bengkel buka pukul 08.00 WIB. Kosongkan jika ingin datang hari ini."
                render={(field) => (
                  <input
                    type="date"
                    min={jakartaToday()}
                    className="flex h-9 w-full border border-input bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    {...field}
                    value={field.value ?? ""}
                  />
                )}
              />
              <FormField
                control={form.control}
                name="complaint"
                label="Keluhan"
                render={(field) => (
                  <textarea
                    rows={4}
                    placeholder="Mesin terasa kasar saat digas"
                    className="flex w-full border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    {...field}
                  />
                )}
              />
            </div>
          )}

          {current.id === "konfirmasi" && (
            <div className="space-y-4">
              <dl className="divide-y border-y text-sm">
                <SummaryRow label="Layanan" onEdit={() => goTo(0)}>
                  {selectedService?.name ?? "Periksa dulu di bengkel"}
                </SummaryRow>
                <SummaryRow label="Motor" onEdit={() => goTo(1)}>
                  <span className="flex flex-wrap items-center gap-2">
                    {values.plateNumber && (
                      <PlateNumber plate={normalizePlate(values.plateNumber)} size="sm" />
                    )}
                    {values.motorModel}
                  </span>
                </SummaryRow>
                <SummaryRow label="Tanggal" onEdit={() => goTo(2)}>
                  {values.serviceDate ? formatDate(values.serviceDate) : "Hari ini"}
                </SummaryRow>
                <SummaryRow label="Keluhan" onEdit={() => goTo(2)}>
                  {values.complaint}
                </SummaryRow>
              </dl>
              <div className="flex items-start gap-2 border-l-2 border-primary bg-primary/10 px-3 py-2.5 text-sm">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>
                  Email konfirmasi akan dikirim ke
                  {user?.email ? ` ${user.email}` : " alamat email akun Anda"}{" "}
                  setelah pesanan dibuat.
                </span>
              </div>
            </div>
          )}

          <EstimateBar service={selectedService} />

          <div className="flex items-center justify-between gap-2">
            {step === 0 ? (
              <Button asChild variant="ghost">
                <Link href="/pelanggan">Batal</Link>
              </Button>
            ) : (
              <Button type="button" variant="ghost" onClick={() => goTo(step - 1)}>
                <ChevronLeft className="mr-1 h-4 w-4" />
                Kembali
              </Button>
            )}
            <Button type="submit" disabled={createBooking.isPending}>
              {isLast ? (
                createBooking.isPending ? "Memproses..." : "Pesan Servis"
              ) : (
                <>
                  Lanjut
                  <ChevronRight className="ml-1 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </main>
  );
}

function WizardProgress({
  step,
  onSelect,
}: {
  step: number;
  onSelect: (index: number) => void;
}) {
  return (
    <ol className="mt-6 grid grid-cols-4 gap-1" aria-label="Langkah pemesanan">
      {WIZARD_STEPS.map((s, i) => {
        const done = i < step;
        const active = i === step;
        return (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => onSelect(i)}
              disabled={!done}
              aria-current={active ? "step" : undefined}
              className="group flex w-full flex-col gap-1.5 text-left disabled:cursor-default"
            >
              <span
                className={cn(
                  "h-1 w-full bg-muted",
                  (done || active) && "bg-primary"
                )}
              />
              <span
                className={cn(
                  "flex items-center gap-1 text-xs",
                  active ? "font-semibold" : "text-muted-foreground",
                  done && "group-hover:text-foreground"
                )}
              >
                {done && <Check className="h-3 w-3" aria-hidden />}
                <span className="truncate">{s.label}</span>
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

function ServicePicker({
  services,
  loading,
  value,
  onChange,
}: {
  services: Service[];
  loading: boolean;
  value: string;
  onChange: (id: string) => void;
}) {
  if (loading) return <LoadingState label="Memuat layanan..." />;

  const options = [
    ...services.map((s) => ({
      id: s._id,
      name: s.name,
      detail: s.description,
      meta: `${formatDuration(s.estimatedDurationMinutes)} · mulai ${formatRupiah(s.estimatedPrice)}`,
    })),
    {
      id: "",
      name: "Belum tahu, periksa dulu",
      detail: "Mekanik memeriksa motor lalu menentukan perbaikan dan biaya.",
      meta: "",
    },
  ];

  return (
    <div role="radiogroup" aria-label="Pilih layanan" className="divide-y border-y">
      {options.map((option) => {
        const selected = option.id === value;
        return (
          <button
            key={option.id || "none"}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.id)}
            className={cn(
              "flex w-full items-start gap-3 px-2 py-3 text-left transition-colors hover:bg-muted/50",
              selected && "bg-primary/10"
            )}
          >
            <span
              className={cn(
                "mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                selected && "border-primary"
              )}
              aria-hidden
            >
              {selected && <span className="h-2 w-2 rounded-full bg-primary" />}
            </span>
            <span className="min-w-0 flex-1 space-y-0.5">
              <span className="block font-semibold">{option.name}</span>
              <span className="line-clamp-2 block text-sm text-muted-foreground">
                {option.detail}
              </span>
              {option.meta && (
                <span className="block text-xs tabular-nums text-muted-foreground">
                  {option.meta}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function SummaryRow({
  label,
  onEdit,
  children,
}: {
  label: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <dt className="w-20 shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 flex-1 break-words">{children}</dd>
      <button
        type="button"
        onClick={onEdit}
        className="shrink-0 text-xs text-primary underline-offset-4 hover:underline"
        aria-label={`Ubah ${label.toLowerCase()}`}
      >
        Ubah
      </button>
    </div>
  );
}

function EstimateBar({ service }: { service?: Service }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-t-2 border-foreground pt-3 text-sm">
      <span className="text-muted-foreground">
        {service
          ? `Perkiraan · ${formatDuration(service.estimatedDurationMinutes)}`
          : "Perkiraan biaya"}
      </span>
      <span className="font-display text-lg font-bold tabular-nums">
        {service ? formatRupiah(service.estimatedPrice) : "Setelah diperiksa"}
      </span>
    </div>
  );
}
