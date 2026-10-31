import { request } from "@/lib/api-client";
import type { AuthResult, User } from "@/types/api";

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  phone: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface UpdateProfilePayload {
  name?: string;
  phone?: string;
}

export interface ChangePasswordPayload {
  oldPassword: string;
  newPassword: string;
}

export function register(payload: RegisterPayload): Promise<AuthResult> {
  return request<AuthResult>({ method: "POST", url: "/auth/register", data: payload });
}

export function login(payload: LoginPayload): Promise<AuthResult> {
  return request<AuthResult>({ method: "POST", url: "/auth/login", data: payload });
}

export function me(): Promise<User> {
  return request<User>({ method: "GET", url: "/auth/me" });
}

export function updateMe(payload: UpdateProfilePayload): Promise<User> {
  return request<User>({ method: "PUT", url: "/auth/me", data: payload });
}

export function changePassword(payload: ChangePasswordPayload): Promise<unknown> {
  return request<unknown>({
    method: "PUT",
    url: "/auth/change-password",
    data: payload,
  });
}
