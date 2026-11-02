import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import {
  useChangePassword,
  useCreateBooking,
  useDeletePart,
  useDeleteService,
  useUpdateProfile,
} from "@/hooks/use-mutations";

const authMocks = vi.hoisted(() => ({
  login: vi.fn(),
  logout: vi.fn(),
  setUser: vi.fn(),
}));

// Keep the mutation's toast side effect out of the jsdom renderer.
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => authMocks,
}));

// Stub services so mutations resolve without network calls.
vi.mock("@/services/bookings", () => {
  const fakeBooking = { _id: "b1", bookingNumber: "MC-1", status: "Antre" };
  return {
    createOnline: vi.fn().mockResolvedValue(fakeBooking),
    createWalkIn: vi.fn(),
  };
});

vi.mock("@/services/parts", () => ({
  remove: vi.fn().mockResolvedValue({ _id: "p1", isActive: false }),
}));

vi.mock("@/services/services", () => ({
  remove: vi.fn().mockResolvedValue({ _id: "s1", isActive: false }),
}));

vi.mock("@/services/auth", () => ({
  updateMe: vi.fn().mockResolvedValue({
    _id: "u1",
    name: "Nama Baru",
    email: "u1@motorcenter.id",
    role: "pelanggan",
    phone: "081234567890",
    isActive: true,
    createdAt: "2026-04-01T00:00:00.000Z",
    updatedAt: "2026-04-01T00:00:00.000Z",
  }),
  changePassword: vi.fn().mockResolvedValue(null),
}));

function wrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  };
}

describe("mutation hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("useCreateBooking invalidates reports and bookings queries", async () => {
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

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["reports"] });
    });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["bookings"] });
  });

  it("useDeletePart invalidates both parts and reports queries", async () => {
    const queryClient = new QueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useDeletePart(), {
      wrapper: wrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync("p1");
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["parts"] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["reports"] });
    });
  });

  it("useDeleteService invalidates services queries", async () => {
    const queryClient = new QueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useDeleteService(), {
      wrapper: wrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync("s1");
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["services"] });
    });
  });

  it("useUpdateProfile updates the authenticated user in AuthProvider", async () => {
    const queryClient = new QueryClient();
    const { result } = renderHook(() => useUpdateProfile(), {
      wrapper: wrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({
        name: "Nama Baru",
        phone: "081234567890",
      });
    });

    expect(authMocks.setUser).toHaveBeenCalledWith(
      expect.objectContaining({ _id: "u1", name: "Nama Baru" })
    );
  });

  it("useChangePassword clears cached queries and logs out after server token invalidation", async () => {
    const queryClient = new QueryClient();
    const clearSpy = vi.spyOn(queryClient, "clear");

    const { result } = renderHook(() => useChangePassword(), {
      wrapper: wrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({
        oldPassword: "oldPassword123",
        newPassword: "newPassword123",
      });
    });

    expect(clearSpy).toHaveBeenCalled();
    expect(authMocks.logout).toHaveBeenCalled();
  });
});
