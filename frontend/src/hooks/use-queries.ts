"use client";

import { useQuery } from "@tanstack/react-query";

import * as bookingsService from "@/services/bookings";
import * as partsService from "@/services/parts";
import * as servicesService from "@/services/services";
import * as usersService from "@/services/users";
import * as reportsService from "@/services/reports";
import type { BookingListQuery } from "@/services/bookings";
import type { PartListQuery } from "@/services/parts";
import type { ServiceListQuery } from "@/services/services";
import type { UserListQuery } from "@/services/users";
import type { RevenueQuery } from "@/services/reports";
import { queryKeys } from "@/hooks/query-keys";

export function useBookings(query: BookingListQuery = {}, enabled = true) {
  return useQuery({
    queryKey: queryKeys.bookings(query),
    queryFn: () => bookingsService.list(query),
    enabled,
  });
}

export function useBooking(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.booking(id ?? ""),
    queryFn: () => bookingsService.getById(id as string),
    enabled: Boolean(id),
  });
}

export function useParts(query: PartListQuery = {}, enabled = true) {
  return useQuery({
    queryKey: queryKeys.parts(query),
    queryFn: () => partsService.list(query),
    enabled,
  });
}

export function useServices(query: ServiceListQuery = {}, enabled = true) {
  return useQuery({
    queryKey: queryKeys.services(query),
    queryFn: () => servicesService.list(query),
    enabled,
  });
}

export function useMechanics(enabled = true) {
  return useQuery({
    queryKey: queryKeys.mechanics(),
    queryFn: () => usersService.mechanics(),
    enabled,
  });
}

export function useUsers(query: UserListQuery = {}, enabled = true) {
  return useQuery({
    queryKey: queryKeys.users(query),
    queryFn: () => usersService.list(query),
    enabled,
  });
}

export function useDashboard(enabled = true) {
  return useQuery({
    queryKey: queryKeys.dashboard(),
    queryFn: () => reportsService.dashboard(),
    enabled,
  });
}

export function useRevenue(query: RevenueQuery = {}, enabled = true) {
  return useQuery({
    queryKey: queryKeys.revenue(query),
    queryFn: () => reportsService.revenue(query),
    enabled,
  });
}
