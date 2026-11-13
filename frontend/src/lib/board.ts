// Pure helpers for the staff work board (Papan Kerja). Kept free of React so
// the move/ordering rules can be unit-tested.

import type { Booking, ServiceStatus } from "@/types/api";
import { canTransition } from "@/lib/transitions";

/** Statuses shown as board columns, in workflow order. */
export const BOARD_STATUSES = [
  "Antre",
  "Diperiksa",
  "Dikerjakan",
  "Selesai",
] as const satisfies readonly ServiceStatus[];

export type BoardStatus = (typeof BOARD_STATUSES)[number];
export type BoardColumns = Record<BoardStatus, Booking[]>;

/** Max tickets fetched per column (backend caps `limit` at 100). */
export const BOARD_COLUMN_LIMIT = 100;

/** Minutes in the current stage after which a card is flagged as slow. */
export const STALE_AFTER_MINUTES: Record<BoardStatus, number> = {
  Antre: 60,
  Diperiksa: 60,
  Dikerjakan: 180,
  Selesai: 240,
};

export function isBoardStatus(status: ServiceStatus): status is BoardStatus {
  return (BOARD_STATUSES as readonly ServiceStatus[]).includes(status);
}

/**
 * Moves the board may perform directly. Cancelling (Dibatalkan) and checkout
 * (Diambil) stay on the ticket detail page, where the fee and invoice live.
 */
export function canBoardMove(from: ServiceStatus, to: ServiceStatus): boolean {
  return isBoardStatus(to) && canTransition(from, to);
}

/** The single forward board move for a status, if any. */
export function nextBoardStatus(from: ServiceStatus): BoardStatus | undefined {
  return BOARD_STATUSES.find((to) => canBoardMove(from, to));
}

/** When the ticket entered its current status (falls back to createdAt). */
export function stageEnteredAt(booking: Booking): Date | undefined {
  for (let i = booking.statusHistory.length - 1; i >= 0; i--) {
    const entry = booking.statusHistory[i];
    if (entry.status === booking.status) return new Date(entry.changedAt);
  }
  return booking.createdAt ? new Date(booking.createdAt) : undefined;
}

export function minutesInStage(booking: Booking, now: Date): number {
  const entered = stageEnteredAt(booking);
  if (!entered || Number.isNaN(entered.getTime())) return 0;
  return Math.max(0, Math.floor((now.getTime() - entered.getTime()) / 60_000));
}

/** Compact Indonesian duration: "5 mnt", "2 j 15 mnt", "3 hr". */
export function formatStageDuration(minutes: number): string {
  if (minutes < 1) return "baru saja";
  if (minutes < 60) return `${minutes} mnt`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    const rest = minutes % 60;
    return rest ? `${hours} j ${rest} mnt` : `${hours} j`;
  }
  return `${Math.floor(hours / 24)} hr`;
}

export function isStale(booking: Booking, now: Date): boolean {
  if (!isBoardStatus(booking.status)) return false;
  return minutesInStage(booking, now) >= STALE_AFTER_MINUTES[booking.status];
}

/** Longest-waiting first, so the queue reads first-come-first-served. */
export function sortByWaiting(bookings: Booking[], now: Date): Booking[] {
  return [...bookings].sort(
    (a, b) => minutesInStage(b, now) - minutesInStage(a, now)
  );
}

/** Case-insensitive match on plate (spaces ignored), number, customer, motor. */
export function matchesBoardSearch(booking: Booking, term: string): boolean {
  const q = term.trim().toLowerCase();
  if (!q) return true;
  const compact = q.replace(/\s+/g, "");
  return (
    booking.plateNumber.toLowerCase().replace(/\s+/g, "").includes(compact) ||
    booking.bookingNumber.toLowerCase().includes(q) ||
    booking.customerName.toLowerCase().includes(q) ||
    booking.motorModel.toLowerCase().includes(q)
  );
}

/**
 * Optimistically move a ticket to `to`: remove it from every column, stamp
 * the new status + history entry, and put it at the end of the target
 * column (it has just entered that stage, so it waited the least).
 * Returns the board unchanged if the ticket is not on it.
 */
export function moveOnBoard(
  columns: BoardColumns,
  id: string,
  to: ServiceStatus,
  now: Date
): BoardColumns {
  let moved: Booking | undefined;
  for (const status of BOARD_STATUSES) {
    moved ??= columns[status].find((b) => b._id === id);
  }
  if (!moved) return columns;

  const updated: Booking = {
    ...moved,
    status: to,
    statusHistory: [
      ...moved.statusHistory,
      { status: to, changedAt: now.toISOString() },
    ],
  };

  const next = {} as BoardColumns;
  for (const status of BOARD_STATUSES) {
    const rest = columns[status].filter((b) => b._id !== id);
    next[status] = status === to ? [...rest, updated] : rest;
  }
  return next;
}

/** Whether the ticket already has a mechanic assigned. */
export function hasMechanic(booking: Booking): boolean {
  return Boolean(booking.mechanicId);
}

export function mechanicName(booking: Booking): string | undefined {
  const ref = booking.mechanicId;
  return ref && typeof ref !== "string" ? ref.name : undefined;
}
