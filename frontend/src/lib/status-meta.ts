import {
  Ban,
  ClipboardCheck,
  Clock,
  PackageCheck,
  Search,
  Wrench,
  type LucideIcon,
} from "lucide-react";

import type { ServiceStatus } from "@/types/api";

/**
 * Single source of truth for how each ticket status looks and reads.
 * Class strings are written out literally so Tailwind can detect them; the
 * colors come from the --status-* tokens in globals.css.
 */
export interface StatusMeta {
  label: string;
  description: string;
  icon: LucideIcon;
  /** Soft badge: tinted fill, colored text and border. */
  badgeClass: string;
  /** Solid fill (stepper current dot, board column accent). */
  solidClass: string;
  /** Text color only. */
  textClass: string;
}

export const STATUS_META: Record<ServiceStatus, StatusMeta> = {
  Antre: {
    label: "Antre",
    description: "Menunggu giliran pemeriksaan",
    icon: Clock,
    badgeClass:
      "bg-status-antre/12 text-status-antre border-status-antre/30",
    solidClass: "bg-status-antre text-background border-status-antre",
    textClass: "text-status-antre",
  },
  Diperiksa: {
    label: "Diperiksa",
    description: "Mekanik sedang memeriksa motor",
    icon: Search,
    badgeClass:
      "bg-status-diperiksa/12 text-status-diperiksa border-status-diperiksa/30",
    solidClass: "bg-status-diperiksa text-background border-status-diperiksa",
    textClass: "text-status-diperiksa",
  },
  Dikerjakan: {
    label: "Dikerjakan",
    description: "Perbaikan sedang dikerjakan",
    icon: Wrench,
    badgeClass:
      "bg-status-dikerjakan/15 text-status-dikerjakan border-status-dikerjakan/35",
    solidClass: "bg-status-dikerjakan text-background border-status-dikerjakan",
    textClass: "text-status-dikerjakan",
  },
  Selesai: {
    label: "Selesai",
    description: "Motor siap diambil",
    icon: ClipboardCheck,
    badgeClass:
      "bg-status-selesai/12 text-status-selesai border-status-selesai/30",
    solidClass: "bg-status-selesai text-background border-status-selesai",
    textClass: "text-status-selesai",
  },
  Diambil: {
    label: "Diambil",
    description: "Motor telah diambil pelanggan",
    icon: PackageCheck,
    badgeClass:
      "bg-status-diambil/12 text-status-diambil border-status-diambil/30",
    solidClass: "bg-status-diambil text-background border-status-diambil",
    textClass: "text-status-diambil",
  },
  Dibatalkan: {
    label: "Dibatalkan",
    description: "Tiket dibatalkan",
    icon: Ban,
    badgeClass:
      "bg-status-dibatalkan/12 text-status-dibatalkan border-status-dibatalkan/30",
    solidClass: "bg-status-dibatalkan text-background border-status-dibatalkan",
    textClass: "text-status-dibatalkan",
  },
};

export function getStatusMeta(status: ServiceStatus): StatusMeta {
  return STATUS_META[status];
}
