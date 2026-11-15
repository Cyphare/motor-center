import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { Booking } from "@/types/api";
import { useBooking } from "@/hooks/use-queries";

const bookingsMock = vi.hoisted(() => ({ getById: vi.fn() }));
vi.mock("@/services/bookings", () => bookingsMock);

function ticket(status: Booking["status"]): Booking {
  return {
    _id: "t1",
    bookingNumber: "MC-1",
    bookingType: "online",
    customerName: "Andi",
    customerPhone: "0812",
    plateNumber: "B 1 A",
    motorModel: "Vario",
    complaint: "-",
    status,
    statusHistory: [],
    serviceFee: 0,
    partsUsed: [],
    partsTotalCost: 0,
    grandTotal: 0,
  };
}

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

const POLL_MS = 20;

describe("useBooking polling", () => {
  beforeEach(() => {
    bookingsMock.getById.mockReset();
  });

  it("keeps polling while open and stops once the ticket is terminal", async () => {
    bookingsMock.getById
      .mockResolvedValueOnce(ticket("Dikerjakan"))
      .mockResolvedValueOnce(ticket("Selesai"))
      .mockResolvedValue(ticket("Diambil"));

    const { result } = renderHook(
      () => useBooking("t1", { pollMs: POLL_MS }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.data?.status).toBe("Diambil"));
    const callsAtTerminal = bookingsMock.getById.mock.calls.length;
    expect(callsAtTerminal).toBe(3);

    await new Promise((r) => setTimeout(r, POLL_MS * 5));
    expect(bookingsMock.getById).toHaveBeenCalledTimes(callsAtTerminal);
  });

  it("does not poll without pollMs", async () => {
    bookingsMock.getById.mockResolvedValue(ticket("Antre"));
    const { result } = renderHook(() => useBooking("t1"), { wrapper });

    await waitFor(() => expect(result.current.data?.status).toBe("Antre"));
    await new Promise((r) => setTimeout(r, POLL_MS * 5));
    expect(bookingsMock.getById).toHaveBeenCalledTimes(1);
  });
});
