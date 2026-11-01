import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { useCreateBooking } from "@/hooks/use-mutations";

// Keep the mutation's toast side effect out of the jsdom renderer.
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// Stub the bookings service so createOnline resolves without a network call.
vi.mock("@/services/bookings", () => {
  const fakeBooking = { _id: "b1", bookingNumber: "MC-1", status: "Antre" };
  return {
    createOnline: vi.fn().mockResolvedValue(fakeBooking),
    createWalkIn: vi.fn(),
  };
});

function wrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  };
}

describe("useCreateBooking", () => {
  it("invalidates the reports and bookings queries after creating a booking", async () => {
    const queryClient = new QueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useCreateBooking(), {
      wrapper: wrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({
        type: "online",
        data: {
          plateNumber: "AB 1234 GA",
          motorModel: "Honda Vario 160",
          complaint: "Tarikan gredeg",
        },
      });
    });

    // The owner dashboard/revenue queries are keyed under ["reports"], so they
    // must be marked stale when the underlying bookings data changes.
    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["reports"] });
    });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["bookings"] });
  });
});
