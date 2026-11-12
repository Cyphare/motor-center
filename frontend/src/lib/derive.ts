// Pure helpers that derive pelanggan views (active service, "Motor Saya")
// from the customer's own bookings. There is no Vehicle entity on the
// backend yet, so motors are reconstructed from booking history.

import type { Booking, ServiceStatus } from "@/types/api";

/** Statuses after which a ticket never changes again. */
export const TERMINAL_STATUSES = [
  "Diambil",
  "Dibatalkan",
] as const satisfies readonly ServiceStatus[];

export function isTerminalStatus(status: ServiceStatus): boolean {
  return (TERMINAL_STATUSES as readonly ServiceStatus[]).includes(status);
}

/** Uppercase, single-spaced plate ("b  1234abc " stays "B 1234ABC"). */
export function normalizePlate(plate: string): string {
  return plate.trim().replace(/\s+/g, " ").toUpperCase();
}

/** Plate comparison key that ignores spacing and case. */
export function plateKey(plate: string): string {
  return plate.replace(/\s+/g, "").toUpperCase();
}

function bookingTime(booking: Booking): number {
  const raw = booking.serviceDate ?? booking.createdAt;
  const time = raw ? new Date(raw).getTime() : 0;
  return Number.isNaN(time) ? 0 : time;
}

/** Newest first, by service date (falls back to createdAt). */
export function sortNewestFirst(bookings: Booking[]): Booking[] {
  return [...bookings].sort((a, b) => bookingTime(b) - bookingTime(a));
}

/** Tickets still in the workshop, oldest first (the one that came in first). */
export function activeBookings(bookings: Booking[]): Booking[] {
  return [...bookings]
    .filter((b) => !isTerminalStatus(b.status))
    .sort((a, b) => bookingTime(a) - bookingTime(b));
}

export interface Motor {
  plateNumber: string;
  /** Model from the most recent booking for this plate. */
  motorModel: string;
  serviceCount: number;
  lastBooking: Booking;
  /** True while one of this motor's tickets is still open. */
  inService: boolean;
}

/**
 * One entry per distinct plate, most recently serviced first. Plates are
 * matched ignoring spaces and case, so "B1234ABC" and "B 1234 ABC" merge.
 */
export function groupByPlate(bookings: Booking[]): Motor[] {
  const motors = new Map<string, Motor>();
  for (const booking of sortNewestFirst(bookings)) {
    const key = plateKey(booking.plateNumber);
    const existing = motors.get(key);
    if (existing) {
      existing.serviceCount += 1;
      existing.inService ||= !isTerminalStatus(booking.status);
    } else {
      motors.set(key, {
        plateNumber: normalizePlate(booking.plateNumber),
        motorModel: booking.motorModel,
        serviceCount: 1,
        lastBooking: booking,
        inService: !isTerminalStatus(booking.status),
      });
    }
  }
  return [...motors.values()];
}

/** Bookings for one plate, newest first. */
export function bookingsForPlate(bookings: Booking[], plate: string): Booking[] {
  const key = plateKey(plate);
  return sortNewestFirst(bookings.filter((b) => plateKey(b.plateNumber) === key));
}
