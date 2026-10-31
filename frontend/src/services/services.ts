import { request, requestPaginated } from "@/lib/api-client";
import type { PaginationMeta, Service } from "@/types/api";

export interface ServiceListQuery {
  includeInactive?: boolean;
  page?: number;
  limit?: number;
}

export interface CreateServicePayload {
  name: string;
  description: string;
  estimatedPrice: number;
  estimatedDurationMinutes: number;
  isActive?: boolean;
}

export type UpdateServicePayload = Partial<CreateServicePayload>;

export function list(
  query: ServiceListQuery = {}
): Promise<{ data: Service[]; pagination?: PaginationMeta }> {
  return requestPaginated<Service[]>({
    method: "GET",
    url: "/services",
    params: query,
  });
}

export function getById(id: string): Promise<Service> {
  return request<Service>({ method: "GET", url: `/services/${id}` });
}

export function create(payload: CreateServicePayload): Promise<Service> {
  return request<Service>({ method: "POST", url: "/services", data: payload });
}

export function update(
  id: string,
  payload: UpdateServicePayload
): Promise<Service> {
  return request<Service>({
    method: "PUT",
    url: `/services/${id}`,
    data: payload,
  });
}

export function remove(id: string): Promise<unknown> {
  return request<unknown>({ method: "DELETE", url: `/services/${id}` });
}
