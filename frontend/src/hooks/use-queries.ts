"use client";

import { useQueries, useQuery } from "@tanstack/react-query";

import * as bookingsService from "@/services/bookings";
import * as partsService from "@/services/parts";
import * as servicesService from "@/services/services";
import * as usersService from "@/services/users";
import * as reportsService from "@/services/reports";
import type { BookingListQuery } from "@/services/bookings";
import type { PartListQuery, PartMovementsQuery } from "@/services/parts";
import type { ServiceListQuery } from "@/services/services";
import type { UserListQuery } from "@/services/users";
import type { RevenueQuery } from "@/services/reports";
import { queryKeys } from "@/hooks/query-keys";
import {
  BOARD_COLUMN_LIMIT,
  BOARD_STATUSES,
  type BoardStatus,
} from "@/lib/board";
import { isTerminalStatus } from "@/lib/derive";
import type { Booking } from "@/types/api";

export function useBookings(query: BookingListQuery = {}, enabled = true) {
  return useQuery({
    queryKey: queryKeys.bookings(query),
    queryFn: () => bookingsService.list(query),
    enabled,
  });
}

export const TRACKING_REFETCH_MS = 15_000;

export interface UseBookingOptions {
  /**
   * Poll every N ms while the ticket is still open. Polling stops by itself
   * once the status is terminal (Diambil / Dibatalkan).
   */
  pollMs?: number;
}

export function useBooking(
  id: string | undefined,
  { pollMs }: UseBookingOptions = {}
) {
  return useQuery({
    queryKey: queryKeys.booking(id ?? ""),
    queryFn: () => bookingsService.getById(id as string),
    enabled: Boolean(id),
    refetchInterval: pollMs
      ? (query) => {
          const status = query.state.data?.status;
          return status && isTerminalStatus(status) ? false : pollMs;
        }
      : undefined,
  });
}

/** Backend cap on `limit`; pelanggan history beyond this is not shown. */
export const OWN_BOOKINGS_LIMIT = 100;

/**
 * The signed-in user's bookings in one page (the backend scopes GET /bookings
 * to the pelanggan). Feeds "Servis aktif", "Motor Saya", and motor history.
 */
export function useOwnBookings(enabled = true) {
  return useBookings({ limit: OWN_BOOKINGS_LIMIT }, enabled);
}

export const BOARD_REFETCH_MS = 20_000;

export interface BoardColumnData {
  status: BoardStatus;
  bookings: Booking[];
  total: number;
}

/**
 * One query per board column (status filter, max 100 each) so a busy column
 * never silently truncates another. Polls so the board stays live.
 */
export function useBoard() {
  return useQueries({
    queries: BOARD_STATUSES.map((status) => ({
      queryKey: queryKeys.boardColumn(status),
      queryFn: () =>
        bookingsService.list({ status, limit: BOARD_COLUMN_LIMIT }),
      refetchInterval: BOARD_REFETCH_MS,
      staleTime: 5_000,
    })),
    combine: (results) => ({
      columns: results.map((r, i) => ({
        status: BOARD_STATUSES[i],
        bookings: r.data?.data ?? [],
        total: r.data?.pagination?.total ?? r.data?.data.length ?? 0,
      })) satisfies BoardColumnData[],
      isLoading: results.some((r) => r.isLoading),
      isError: results.some((r) => r.isError),
      error: results.find((r) => r.error)?.error,
      isFetching: results.some((r) => r.isFetching),
      refetch: () => Promise.all(results.map((r) => r.refetch())),
    }),
  });
}

export function useParts(query: PartListQuery = {}, enabled = true) {
  return useQuery({
    queryKey: queryKeys.parts(query),
    queryFn: () => partsService.list(query),
    enabled,
  });
}

export function useLowStockParts(enabled = true) {
  return useQuery({
    queryKey: queryKeys.lowStock(),
    queryFn: () => partsService.lowStock(),
    enabled,
  });
}

export function usePartMovements(
  id: string | undefined,
  query: PartMovementsQuery = {},
  enabled = true
) {
  return useQuery({
    queryKey: queryKeys.partMovements(id ?? "", query),
    queryFn: () => partsService.movements(id as string, query),
    enabled: Boolean(id) && enabled,
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
