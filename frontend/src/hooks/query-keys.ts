import type { BookingListQuery } from "@/services/bookings";
import type { PartListQuery, PartMovementsQuery } from "@/services/parts";
import type { ServiceListQuery } from "@/services/services";
import type { UserListQuery } from "@/services/users";
import type { RevenueQuery } from "@/services/reports";
import type { ServiceStatus } from "@/types/api";

export const queryKeys = {
  bookings: (query?: BookingListQuery) => ["bookings", query ?? {}] as const,
  booking: (id: string) => ["bookings", "detail", id] as const,
  // Under the "bookings" prefix so every existing invalidation refreshes it.
  boardAll: () => ["bookings", "board"] as const,
  boardColumn: (status: ServiceStatus) =>
    ["bookings", "board", status] as const,
  parts: (query?: PartListQuery) => ["parts", query ?? {}] as const,
  lowStock: () => ["parts", "low-stock"] as const,
  partMovements: (id: string, query?: PartMovementsQuery) =>
    ["parts", "movements", id, query ?? {}] as const,
  services: (query?: ServiceListQuery) => ["services", query ?? {}] as const,
  mechanics: () => ["mechanics"] as const,
  users: (query?: UserListQuery) => ["users", query ?? {}] as const,
  dashboard: () => ["reports", "dashboard"] as const,
  revenue: (query?: RevenueQuery) => ["reports", "revenue", query ?? {}] as const,
};
