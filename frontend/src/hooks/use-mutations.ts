"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import * as authService from "@/services/auth";
import * as bookingsService from "@/services/bookings";
import type {
  AddPartPayload,
  CreateOnlineBookingPayload,
  CreateWalkInBookingPayload,
  UpdateStatusPayload,
} from "@/services/bookings";
import { useAuth } from "@/hooks/use-auth";
import { ApiRequestError } from "@/lib/api-client";

function errorMessage(error: unknown): string {
  if (error instanceof ApiRequestError) return error.message;
  if (error instanceof Error) return error.message;
  return "Terjadi kesalahan tak terduga";
}

export function useLogin() {
  const { login } = useAuth();
  return useMutation({
    mutationFn: authService.login,
    onSuccess: (result) => {
      login(result);
      toast.success("Login berhasil");
    },
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
      toast.success(`Status diubah ke '${booking.status}'`);
    },
    onError: (error) => toast.error(errorMessage(error)),
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
      toast.success("Suku cadang dibatalkan dan stok dikembalikan");
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
}
