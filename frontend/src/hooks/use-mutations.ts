"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import * as authService from "@/services/auth";
import * as bookingsService from "@/services/bookings";
import * as partsService from "@/services/parts";
import * as servicesService from "@/services/services";
import * as usersService from "@/services/users";
import type {
  ChangePasswordPayload,
  UpdateProfilePayload,
} from "@/services/auth";
import type { CreateStaffPayload } from "@/services/users";
import type {
  AddPartPayload,
  CreateOnlineBookingPayload,
  CreateWalkInBookingPayload,
  UpdateStatusPayload,
} from "@/services/bookings";
import type {
  CreatePartPayload,
  RestockPartPayload,
  UpdatePartPayload,
} from "@/services/parts";
import type {
  CreateServicePayload,
  UpdateServicePayload,
} from "@/services/services";
import { useAuth } from "@/hooks/use-auth";
import { queryKeys } from "@/hooks/query-keys";
import { ApiRequestError } from "@/lib/api-client";
import { BOARD_STATUSES, moveOnBoard, type BoardColumns } from "@/lib/board";
import type { Booking, PaginationMeta, ServiceStatus } from "@/types/api";

function errorMessage(error: unknown): string {
  if (error instanceof ApiRequestError) return error.message;
  if (error instanceof Error) return error.message;
  return "Terjadi kesalahan tak terduga";
}

export function useLogin() {
  const { login } = useAuth();
  return useMutation({
    mutationFn: authService.login,
    // No success toast: landing on the role's home page is the feedback.
    onSuccess: (result) => login(result),
    onError: (error) => toast.error(errorMessage(error)),
  });
}

export function useRegister() {
  const { login } = useAuth();
  return useMutation({
    mutationFn: authService.register,
    onSuccess: (result) => {
      login(result);
      toast.success("Pendaftaran akun berhasil");
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
}

export function useUpdateProfile() {
  const { setUser } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateProfilePayload) => authService.updateMe(data),
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      void queryClient.invalidateQueries({ queryKey: ["users"] });
      void queryClient.invalidateQueries({ queryKey: ["mechanics"] });
      toast.success("Profil berhasil diperbarui");
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
}

export function useChangePassword() {
  const { logout } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ChangePasswordPayload) =>
      authService.changePassword(data),
    onSuccess: () => {
      queryClient.clear();
      logout();
      toast.success(
        "Kata sandi berhasil diperbarui. Silakan masuk kembali dengan sandi baru."
      );
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (
      payload:
        | { type: "online"; data: CreateOnlineBookingPayload }
        | { type: "walk-in"; data: CreateWalkInBookingPayload }
    ) =>
      payload.type === "online"
        ? bookingsService.createOnline(payload.data)
        : bookingsService.createWalkIn(payload.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["bookings"] });
      void queryClient.invalidateQueries({ queryKey: ["reports"] });
      toast.success("Tiket servis berhasil dibuat");
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
}

export function useUpdateStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStatusPayload }) =>
      bookingsService.updateStatus(id, data),
    onSuccess: (booking) => {
      void queryClient.invalidateQueries({ queryKey: ["bookings"] });
      void queryClient.invalidateQueries({
        queryKey: ["parts"],
      });
      void queryClient.invalidateQueries({ queryKey: ["reports"] });
      toast.success(`Status diubah ke '${booking.status}'`);
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
}

type BoardSnapshot = Array<
  [readonly unknown[], { data: Booking[]; pagination?: PaginationMeta } | undefined]
>;

/**
 * Status change from the work board. The card moves instantly (optimistic),
 * and snaps back with an error toast if the backend rejects the move.
 */
export function useMoveBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, to }: { id: string; to: ServiceStatus }) =>
      bookingsService.updateStatus(id, { status: to }),
    onMutate: async ({ id, to }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.boardAll() });

      const snapshot: BoardSnapshot = BOARD_STATUSES.map((status) => [
        queryKeys.boardColumn(status),
        queryClient.getQueryData(queryKeys.boardColumn(status)),
      ]);

      const columns = {} as BoardColumns;
      BOARD_STATUSES.forEach((status, i) => {
        columns[status] = snapshot[i][1]?.data ?? [];
      });
      const next = moveOnBoard(columns, id, to, new Date());

      BOARD_STATUSES.forEach((status, i) => {
        const previous = snapshot[i][1];
        if (!previous && next[status].length === 0) return;
        queryClient.setQueryData(queryKeys.boardColumn(status), {
          ...previous,
          data: next[status],
        });
      });

      return { snapshot };
    },
    onError: (error, _vars, context) => {
      context?.snapshot.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
      toast.error(errorMessage(error));
    },
    onSuccess: (booking) => {
      toast.success(`${booking.bookingNumber} → ${booking.status}`);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["bookings"] });
      void queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}

export function useAssignMechanic() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, mechanicId }: { id: string; mechanicId: string }) =>
      bookingsService.assign(id, mechanicId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["bookings"] });
      toast.success("Mekanik berhasil ditugaskan");
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
}

export function useAddPart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AddPartPayload }) =>
      bookingsService.addPart(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["bookings"] });
      void queryClient.invalidateQueries({ queryKey: ["parts"] });
      void queryClient.invalidateQueries({ queryKey: ["reports"] });
      toast.success("Suku cadang ditambahkan ke tiket");
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
}

export function useRemovePart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, partItemId }: { id: string; partItemId: string }) =>
      bookingsService.removePart(id, partItemId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["bookings"] });
      void queryClient.invalidateQueries({ queryKey: ["parts"] });
      void queryClient.invalidateQueries({ queryKey: ["reports"] });
      toast.success("Suku cadang dibatalkan dan stok dikembalikan");
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
}

export function useCreatePart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePartPayload) => partsService.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["parts"] });
      void queryClient.invalidateQueries({ queryKey: ["reports"] });
      toast.success("Suku cadang berhasil dibuat");
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
}

export function useUpdatePart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePartPayload }) =>
      partsService.update(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["parts"] });
      void queryClient.invalidateQueries({ queryKey: ["reports"] });
      toast.success("Suku cadang berhasil diperbarui");
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
}

export function useRestockPart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RestockPartPayload }) =>
      partsService.restock(id, data),
    onSuccess: (part, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["parts"] });
      void queryClient.invalidateQueries({ queryKey: ["reports"] });
      toast.success(
        `Stok ${part.name} berhasil ditambah sebanyak ${variables.data.quantity} ${part.unit}`
      );
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
}

export function useDeletePart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => partsService.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["parts"] });
      void queryClient.invalidateQueries({ queryKey: ["reports"] });
      toast.success("Suku cadang berhasil dinonaktifkan");
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
}

export function useCreateStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateStaffPayload) => usersService.createStaff(data),
    onSuccess: (user) => {
      void queryClient.invalidateQueries({ queryKey: ["users"] });
      void queryClient.invalidateQueries({ queryKey: ["mechanics"] });
      toast.success(`Akun staf ${user.name} berhasil dibuat`);
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
}

export function useToggleUserStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      usersService.toggleStatus(id, isActive),
    onSuccess: (user) => {
      void queryClient.invalidateQueries({ queryKey: ["users"] });
      void queryClient.invalidateQueries({ queryKey: ["mechanics"] });
      toast.success(
        `Akun ${user.name} berhasil ${user.isActive ? "diaktifkan" : "dinonaktifkan"}`
      );
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
}

export function useCreateService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateServicePayload) => servicesService.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["services"] });
      toast.success("Layanan berhasil dibuat");
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
}

export function useUpdateService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateServicePayload }) =>
      servicesService.update(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["services"] });
      toast.success("Layanan berhasil diperbarui");
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
}

export function useDeleteService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => servicesService.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["services"] });
      toast.success("Layanan berhasil dinonaktifkan");
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
}
