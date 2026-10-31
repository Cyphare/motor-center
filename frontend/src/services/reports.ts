import { request } from "@/lib/api-client";
import type { DashboardReport, RevenueReport } from "@/types/api";

export interface RevenueQuery {
  startDate?: string;
  endDate?: string;
}

export function dashboard(): Promise<DashboardReport> {
  return request<DashboardReport>({
    method: "GET",
    url: "/reports/dashboard",
  });
}

export function revenue(query: RevenueQuery = {}): Promise<RevenueReport> {
  return request<RevenueReport>({
    method: "GET",
    url: "/reports/revenue",
    params: query,
  });
}
