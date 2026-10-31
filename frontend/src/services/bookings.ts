import { request, requestBlob, requestPaginated } from "@/lib/api-client";
import type {
  Booking,
  BookingType,
  PaginationMeta,
  ServiceStatus,
} from "@/types/api";

export interface CreateOnlineBookingPayload {
  plateNumber: string;
  motorModel: string;
  complaint: string;
  serviceId?: string;
  serviceDate?: string;
}

export interface CreateWalkInBookingPayload {
  customerName: string;
  customerPhone: string;
  plateNumber: string;
  motorModel: string;
  complaint: string;
  serviceId?: string;
  mechanicId?: string;
  serviceFee?: number;
}

export interface BookingListQuery {
  status?: ServiceStatus;
  bookingType?: BookingType;
  plateNumber?: string;
  mechanicId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface UpdateStatusPayload {
  status: ServiceStatus;
  mechanicNotes?: string;
  serviceFee?: number;
}

export interface AddPartPayload {
  partId: string;
  quantity: number;
}

export function createOnline(
  payload: CreateOnlineBookingPayload
): Promise<Booking> {
  return request<Booking>({
    method: "POST",
    url: "/bookings/online",
    data: payload,
  });
}

export function createWalkIn(
  payload: CreateWalkInBookingPayload
): Promise<Booking> {
  return request<Booking>({
    method: "POST",
    url: "/bookings/walk-in",
    data: payload,
  });
}

export function list(
  query: BookingListQuery = {}
): Promise<{ data: Booking[]; pagination?: PaginationMeta }> {
  return requestPaginated<Booking[]>({
    method: "GET",
    url: "/bookings",
    params: query,
  });
}

export function getById(id: string): Promise<Booking> {
  return request<Booking>({ method: "GET", url: `/bookings/${id}` });
}

export function assign(id: string, mechanicId: string): Promise<Booking> {
  return request<Booking>({
    method: "PUT",
    url: `/bookings/${id}/assign`,
    data: { mechanicId },
  });
}

export function updateStatus(
  id: string,
  payload: UpdateStatusPayload
): Promise<Booking> {
  return request<Booking>({
    method: "PUT",
    url: `/bookings/${id}/status`,
    data: payload,
  });
}

export function addPart(id: string, payload: AddPartPayload): Promise<Booking> {
  return request<Booking>({
    method: "POST",
    url: `/bookings/${id}/parts`,
    data: payload,
  });
}

export function removePart(id: string, partItemId: string): Promise<Booking> {
  return request<Booking>({
    method: "DELETE",
    url: `/bookings/${id}/parts/${partItemId}`,
  });
}

export function invoicePdfBlob(id: string): Promise<Blob> {
  return requestBlob({ method: "GET", url: `/bookings/${id}/invoice/pdf` });
}
