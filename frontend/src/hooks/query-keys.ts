import type { BookingListQuery } from "@/services/bookings";
import type { PartListQuery } from "@/services/parts";
import type { ServiceListQuery } from "@/services/services";
import type { UserListQuery } from "@/services/users";
import type { RevenueQuery } from "@/services/reports";

export const queryKeys = {
  bookings: (query?: BookingListQuery) => ["bookings", query ?? {}] as const,
  booking: (id: string) => ["bookings", "detail", id] as const,
  parts: (query?: PartListQuery) => ["parts", query ?? {}] as const,
  lowStock: () => ["parts", "low-stock"] as const,
  services: (query?: ServiceListQuery) => ["services", query ?? {}] as const,
  mechanics: () => ["mechanics"] as const,
  users: (query?: UserListQuery) => ["users", query ?? {}] as const,
  dashboard: () => ["reports", "dashboard"] as const,
  revenue: (query?: RevenueQuery) => ["reports", "revenue", query ?? {}] as const,
};
