import { describe, expect, it } from "vitest";

import type { Booking, ServiceStatus } from "@/types/api";
import {
  activeBookings,
  bookingsForPlate,
  groupByPlate,
  isTerminalStatus,
  normalizePlate,
  plateKey,
} from "@/lib/derive";

function booking(
  id: string,
  plateNumber: string,
  status: ServiceStatus,
  serviceDate: string,
  motorModel = "Honda Vario 125"
): Booking {
  return {
    _id: id,
    bookingNumber: `MC-${id}`,
    bookingType: "online",
    customerName: "Andi",
    customerPhone: "0812",
    plateNumber,
    motorModel,
    complaint: "Servis rutin",
    status,
    statusHistory: [],
    serviceFee: 0,
    partsUsed: [],
    partsTotalCost: 0,
    grandTotal: 0,
    serviceDate,
  };
}

describe("isTerminalStatus", () => {
  it("treats only Diambil and Dibatalkan as terminal", () => {
    expect(isTerminalStatus("Diambil")).toBe(true);
    expect(isTerminalStatus("Dibatalkan")).toBe(true);
    for (const s of ["Antre", "Diperiksa", "Dikerjakan", "Selesai"] as const) {
      expect(isTerminalStatus(s)).toBe(false);
    }
  });
});

describe("plate helpers", () => {
  it("normalizes spacing and case", () => {
    expect(normalizePlate("  b   1234 abc ")).toBe("B 1234 ABC");
    expect(plateKey("b 1234 abc")).toBe(plateKey("B1234ABC"));
  });
});

describe("activeBookings", () => {
  it("keeps open tickets, oldest first", () => {
    const list = [
      booking("1", "B 1", "Diambil", "2026-11-01T00:00:00Z"),
      booking("2", "B 2", "Dikerjakan", "2026-11-05T00:00:00Z"),
      booking("3", "B 3", "Antre", "2026-11-03T00:00:00Z"),
      booking("4", "B 4", "Dibatalkan", "2026-11-06T00:00:00Z"),
    ];
    expect(activeBookings(list).map((b) => b._id)).toEqual(["3", "2"]);
  });
});

describe("groupByPlate", () => {
  it("merges plates ignoring spacing, newest model wins", () => {
    const motors = groupByPlate([
      booking("1", "B1234ABC", "Diambil", "2026-10-01T00:00:00Z", "Vario 125"),
      booking("2", "b 1234 abc", "Antre", "2026-11-01T00:00:00Z", "Vario 160"),
      booking("3", "AB 99 XY", "Diambil", "2026-09-01T00:00:00Z", "Beat"),
    ]);
    expect(motors).toHaveLength(2);
    expect(motors[0]).toMatchObject({
      plateNumber: "B 1234 ABC",
      motorModel: "Vario 160",
      serviceCount: 2,
      inService: true,
    });
    expect(motors[0].lastBooking._id).toBe("2");
    expect(motors[1]).toMatchObject({
      plateNumber: "AB 99 XY",
      serviceCount: 1,
      inService: false,
    });
  });

  it("returns nothing for no bookings", () => {
    expect(groupByPlate([])).toEqual([]);
  });
});

describe("bookingsForPlate", () => {
  it("matches the exact plate only, newest first", () => {
    const list = [
      booking("1", "B 12 A", "Diambil", "2026-10-01T00:00:00Z"),
      booking("2", "B 123 A", "Diambil", "2026-10-02T00:00:00Z"),
      booking("3", "B12A", "Antre", "2026-11-01T00:00:00Z"),
    ];
    expect(bookingsForPlate(list, "b 12 a").map((b) => b._id)).toEqual([
      "3",
      "1",
    ]);
  });
});
