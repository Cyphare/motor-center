import { describe, expect, it } from "vitest";

import type { Booking, ServiceStatus } from "@/types/api";
import {
  canBoardMove,
  formatStageDuration,
  isStale,
  matchesBoardSearch,
  minutesInStage,
  moveOnBoard,
  nextBoardStatus,
  sortByWaiting,
  type BoardColumns,
} from "@/lib/board";

const NOW = new Date("2026-11-10T10:00:00.000Z");

function minutesAgo(m: number): string {
  return new Date(NOW.getTime() - m * 60_000).toISOString();
}

function booking(
  id: string,
  status: ServiceStatus,
  enteredMinutesAgo: number,
  extra: Partial<Booking> = {}
): Booking {
  return {
    _id: id,
    bookingNumber: `MC-${id}`,
    bookingType: "walk-in",
    customerName: "Andi Pratama",
    customerPhone: "0812",
    plateNumber: "B 1234 XYZ",
    motorModel: "Honda Vario 160",
    complaint: "Servis",
    status,
    statusHistory: [
      { status: "Antre", changedAt: minutesAgo(enteredMinutesAgo + 30) },
      ...(status === "Antre"
        ? []
        : [{ status, changedAt: minutesAgo(enteredMinutesAgo) }]),
    ],
    serviceFee: 0,
    partsUsed: [],
    partsTotalCost: 0,
    grandTotal: 0,
    createdAt: minutesAgo(enteredMinutesAgo + 30),
    ...extra,
  };
}

describe("board moves", () => {
  it("allows only forward board columns", () => {
    expect(canBoardMove("Antre", "Diperiksa")).toBe(true);
    expect(canBoardMove("Diperiksa", "Dikerjakan")).toBe(true);
    expect(canBoardMove("Dikerjakan", "Selesai")).toBe(true);
    expect(canBoardMove("Antre", "Dikerjakan")).toBe(false);
    expect(canBoardMove("Dikerjakan", "Diperiksa")).toBe(false);
  });

  it("keeps cancel and checkout off the board", () => {
    expect(canBoardMove("Antre", "Dibatalkan")).toBe(false);
    expect(canBoardMove("Selesai", "Diambil")).toBe(false);
    expect(nextBoardStatus("Selesai")).toBeUndefined();
    expect(nextBoardStatus("Antre")).toBe("Diperiksa");
  });
});

describe("time in stage", () => {
  it("uses the latest history entry for the current status", () => {
    expect(minutesInStage(booking("1", "Dikerjakan", 45), NOW)).toBe(45);
  });

  it("falls back to createdAt for a fresh Antre ticket without history", () => {
    const b = booking("1", "Antre", 0, {
      statusHistory: [],
      createdAt: minutesAgo(12),
    });
    expect(minutesInStage(b, NOW)).toBe(12);
  });

  it("formats durations compactly", () => {
    expect(formatStageDuration(0)).toBe("baru saja");
    expect(formatStageDuration(5)).toBe("5 mnt");
    expect(formatStageDuration(120)).toBe("2 j");
    expect(formatStageDuration(135)).toBe("2 j 15 mnt");
    expect(formatStageDuration(60 * 50)).toBe("2 hr");
  });

  it("flags slow tickets per stage threshold", () => {
    expect(isStale(booking("1", "Diperiksa", 61), NOW)).toBe(true);
    expect(isStale(booking("1", "Dikerjakan", 61), NOW)).toBe(false);
  });

  it("sorts longest-waiting first", () => {
    const sorted = sortByWaiting(
      [booking("a", "Diperiksa", 5), booking("b", "Diperiksa", 50)],
      NOW
    );
    expect(sorted.map((b) => b._id)).toEqual(["b", "a"]);
  });
});

describe("matchesBoardSearch", () => {
  const b = booking("1", "Antre", 0);
  it("matches plate ignoring spaces and case", () => {
    expect(matchesBoardSearch(b, "b1234")).toBe(true);
    expect(matchesBoardSearch(b, "1234 xyz")).toBe(true);
  });
  it("matches customer, motor, and booking number", () => {
    expect(matchesBoardSearch(b, "andi")).toBe(true);
    expect(matchesBoardSearch(b, "vario")).toBe(true);
    expect(matchesBoardSearch(b, "mc-1")).toBe(true);
    expect(matchesBoardSearch(b, "yamaha")).toBe(false);
  });
});

describe("moveOnBoard", () => {
  const columns: BoardColumns = {
    Antre: [booking("a", "Antre", 10), booking("b", "Antre", 5)],
    Diperiksa: [booking("c", "Diperiksa", 20)],
    Dikerjakan: [],
    Selesai: [],
  };

  it("moves the card, stamps status and history", () => {
    const next = moveOnBoard(columns, "a", "Diperiksa", NOW);
    expect(next.Antre.map((x) => x._id)).toEqual(["b"]);
    expect(next.Diperiksa.map((x) => x._id)).toEqual(["c", "a"]);
    const moved = next.Diperiksa[1];
    expect(moved.status).toBe("Diperiksa");
    expect(moved.statusHistory.at(-1)).toEqual({
      status: "Diperiksa",
      changedAt: NOW.toISOString(),
    });
  });

  it("does not mutate the input", () => {
    moveOnBoard(columns, "a", "Diperiksa", NOW);
    expect(columns.Antre).toHaveLength(2);
    expect(columns.Antre[0].status).toBe("Antre");
  });

  it("returns the same board for an unknown id", () => {
    expect(moveOnBoard(columns, "zzz", "Selesai", NOW)).toBe(columns);
  });
});
