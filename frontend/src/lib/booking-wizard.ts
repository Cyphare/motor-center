// Pure pieces of the pelanggan booking wizard: step order, which form fields
// each step validates, and the date conversion sent to the backend.

import type { CreateOnlineBookingFormValues } from "@/lib/validations";

export const WIZARD_STEPS = [
  { id: "layanan", label: "Layanan", fields: ["serviceId"] },
  { id: "motor", label: "Motor", fields: ["plateNumber", "motorModel"] },
  { id: "jadwal", label: "Jadwal & Keluhan", fields: ["serviceDate", "complaint"] },
  { id: "konfirmasi", label: "Konfirmasi", fields: [] },
] as const satisfies readonly {
  id: string;
  label: string;
  fields: readonly (keyof CreateOnlineBookingFormValues)[];
}[];

export type WizardStepId = (typeof WIZARD_STEPS)[number]["id"];

/** First step that owns one of `fields`, used to jump back to a server error. */
export function stepForFields(fields: readonly string[]): number {
  const index = WIZARD_STEPS.findIndex((step) =>
    (step.fields as readonly string[]).some((f) => fields.includes(f))
  );
  return index === -1 ? WIZARD_STEPS.length - 1 : index;
}

/** Hour (Asia/Jakarta) a date-only booking is scheduled for: opening time. */
export const DEFAULT_BOOKING_HOUR = 8;

/**
 * "2026-11-14" → "2026-11-14T08:00:00+07:00". The backend wants an ISO
 * datetime with offset; the wizard only asks for a day.
 */
export function serviceDateToIso(date: string): string | undefined {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return undefined;
  const hour = String(DEFAULT_BOOKING_HOUR).padStart(2, "0");
  return `${date}T${hour}:00:00+07:00`;
}

/** Today's calendar date in Asia/Jakarta as YYYY-MM-DD. */
export function jakartaToday(now: Date = new Date()): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
