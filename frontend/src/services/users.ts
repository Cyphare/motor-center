import { request, requestPaginated } from "@/lib/api-client";
import type { Mechanic, PaginationMeta, User, UserRole } from "@/types/api";

export interface CreateStaffPayload {
  name: string;
  email: string;
  password: string;
  role: Exclude<UserRole, "pelanggan">;
  phone: string;
}

export interface UserListQuery {
  role?: UserRole;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export function createStaff(payload: CreateStaffPayload): Promise<User> {
  return request<User>({ method: "POST", url: "/users", data: payload });
}

export function mechanics(): Promise<Mechanic[]> {
  return request<Mechanic[]>({ method: "GET", url: "/users/mechanics" });
}

export function list(
  query: UserListQuery = {}
): Promise<{ data: User[]; pagination?: PaginationMeta }> {
  return requestPaginated<User[]>({ method: "GET", url: "/users", params: query });
}

export function getById(id: string): Promise<User> {
  return request<User>({ method: "GET", url: `/users/${id}` });
}

export function toggleStatus(id: string, isActive: boolean): Promise<User> {
  return request<User>({
    method: "PATCH",
    url: `/users/${id}/status`,
    data: { isActive },
  });
}
