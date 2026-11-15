import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { Booking } from "@/types/api";
import { queryKeys } from "@/hooks/query-keys";
import { useMoveBooking } from "@/hooks/use-mutations";
import { ApiRequestError } from "@/lib/api-client";

const toastMocks = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("sonner", () => ({ toast: toastMocks }));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({ login: vi.fn(), logout: vi.fn(), setUser: vi.fn() }),
}));

const bookingsMock = vi.hoisted(() => ({ updateStatus: vi.fn() }));
vi.mock("@/services/bookings", () => bookingsMock);

function card(id: string, status: Booking["status"]): Booking {
  return {
    _id: id,
    bookingNumber: `MC-${id}`,
    bookingType: "walk-in",
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

function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  client.setQueryData(queryKeys.boardColumn("Antre"), {
    data: [card("a", "Antre")],
  });
  client.setQueryData(queryKeys.boardColumn("Diperiksa"), { data: [] });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useMoveBooking(), { wrapper });
  return { client, result };
}

function ids(client: QueryClient, status: Booking["status"]): string[] {
  const data = client.getQueryData<{ data: Booking[] }>(
    queryKeys.boardColumn(status)
  );
  return data?.data.map((b) => b._id) ?? [];
}

describe("useMoveBooking", () => {
  beforeEach(() => vi.clearAllMocks());

  it("moves the card before the request resolves", async () => {
    let resolve!: (b: Booking) => void;
    bookingsMock.updateStatus.mockReturnValue(
      new Promise<Booking>((r) => (resolve = r))
    );
    const { client, result } = setup();

    act(() => result.current.mutate({ id: "a", to: "Diperiksa" }));

    await waitFor(() => expect(ids(client, "Diperiksa")).toEqual(["a"]));
    expect(ids(client, "Antre")).toEqual([]);

    await act(async () => resolve(card("a", "Diperiksa")));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("rolls the card back and shows the backend message on failure", async () => {
    bookingsMock.updateStatus.mockRejectedValue(
      new ApiRequestError("Tugaskan mekanik terlebih dahulu", 400)
    );
    const { client, result } = setup();

    act(() => result.current.mutate({ id: "a", to: "Diperiksa" }));

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(ids(client, "Antre")).toEqual(["a"]);
    expect(ids(client, "Diperiksa")).toEqual([]);
    expect(toastMocks.error).toHaveBeenCalledWith(
      "Tugaskan mekanik terlebih dahulu"
    );
  });
});
