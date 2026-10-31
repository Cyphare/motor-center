import type { ServiceStatus } from "@/types/api";
import { ALLOWED_TRANSITIONS } from "@/types/api";

/**
 * Whether a ticket may move from `from` to `to`, per the backend-mirrored
 * ALLOWED_TRANSITIONS map.
 */
export function canTransition(from: ServiceStatus, to: ServiceStatus): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * The set of statuses a ticket in `from` may transition to next.
 */
export function nextStatuses(from: ServiceStatus): ServiceStatus[] {
  return ALLOWED_TRANSITIONS[from] ?? [];
}

/**
 * Whether the status is terminal (no further transitions allowed).
 */
export function isTerminalStatus(status: ServiceStatus): boolean {
  return (ALLOWED_TRANSITIONS[status] ?? []).length === 0;
}
