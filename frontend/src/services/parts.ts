import { request, requestPaginated } from "@/lib/api-client";
import type {
  PaginationMeta,
  Part,
  StockMovement,
  StockMovementType,
} from "@/types/api";

export interface PartListQuery {
  includeInactive?: boolean;
}

export interface CreatePartPayload {
  code: string;
  name: string;
  stock: number;
  minStock: number;
  price: number;
  unit: string;
  isActive?: boolean;
}

export type UpdatePartPayload = Partial<CreatePartPayload>;

export interface RestockPartPayload {
  quantity: number;
  note?: string;
}

export interface PartMovementsQuery {
  type?: StockMovementType;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export function list(query: PartListQuery = {}): Promise<Part[]> {
  return request<Part[]>({
    method: "GET",
    url: "/parts",
    params: query,
  });
}

export function lowStock(): Promise<Part[]> {
  return request<Part[]>({ method: "GET", url: "/parts/low-stock" });
}

export function getById(id: string): Promise<Part> {
  return request<Part>({ method: "GET", url: `/parts/${id}` });
}

export function create(payload: CreatePartPayload): Promise<Part> {
  return request<Part>({ method: "POST", url: "/parts", data: payload });
}

export function update(id: string, payload: UpdatePartPayload): Promise<Part> {
  return request<Part>({ method: "PUT", url: `/parts/${id}`, data: payload });
}

export function restock(
  id: string,
  payload: RestockPartPayload
): Promise<Part> {
  return request<Part>({
    method: "PATCH",
    url: `/parts/${id}/restock`,
    data: payload,
  });
}

export function movements(
  id: string,
  query: PartMovementsQuery = {}
): Promise<{ data: StockMovement[]; pagination?: PaginationMeta }> {
  return requestPaginated<StockMovement[]>({
    method: "GET",
    url: `/parts/${id}/movements`,
    params: query,
  });
}

export function remove(id: string): Promise<Part> {
  return request<Part>({ method: "DELETE", url: `/parts/${id}` });
}
