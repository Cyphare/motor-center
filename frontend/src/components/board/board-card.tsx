"use client";

import Link from "next/link";
import { useDraggable } from "@dnd-kit/core";
import {
  ArrowRight,
  Clock,
  GripVertical,
  Receipt,
  UserPlus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { PlateNumber } from "@/components/plate-number";
import { UserAvatar } from "@/components/shell/user-menu";
import {
  formatStageDuration,
  hasMechanic,
  isStale,
  mechanicName,
  minutesInStage,
  nextBoardStatus,
} from "@/lib/board";
import { getStatusMeta } from "@/lib/status-meta";
import { cn } from "@/lib/utils";
import type { Booking } from "@/types/api";

export interface BoardCardProps {
  booking: Booking;
  now: Date;
  onAdvance?: (booking: Booking) => void;
  onAssign?: (booking: Booking) => void;
  /** Render without drag wiring (used inside the DragOverlay). */
  overlay?: boolean;
  pending?: boolean;
}

export function BoardCard({
  booking,
  now,
  onAdvance,
  onAssign,
  overlay,
  pending,
}: BoardCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: booking._id,
    data: { booking },
    disabled: overlay || pending,
  });

  const next = nextBoardStatus(booking.status);
  const minutes = minutesInStage(booking, now);
  const stale = isStale(booking, now);
  const mechanic = mechanicName(booking);
  const needsMechanic = !hasMechanic(booking);

  return (
    <article
      ref={overlay ? undefined : setNodeRef}
      className={cn(
        "group rounded-lg border bg-card p-3 shadow-xs transition-shadow",
        isDragging && "opacity-40",
        overlay && "rotate-1 shadow-xl ring-2 ring-primary",
        pending && "animate-pulse"
      )}
    >
      <header className="flex items-start gap-2">
        <button
          type="button"
          className="-ml-1 mt-0.5 cursor-grab touch-none rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring active:cursor-grabbing"
          aria-label={`Pindahkan ${booking.bookingNumber}`}
          {...(overlay ? {} : { ...attributes, ...listeners })}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <PlateNumber plate={booking.plateNumber} size="sm" />
            <span
              className={cn(
                "flex items-center gap-1 text-xs tabular-nums",
                stale
                  ? "font-semibold text-status-dikerjakan"
                  : "text-muted-foreground"
              )}
              title={stale ? "Sudah lama di tahap ini" : "Waktu di tahap ini"}
            >
              <Clock className="h-3 w-3" />
              {formatStageDuration(minutes)}
            </span>
          </div>
          <Link
            href={`/staff/${booking._id}`}
            className="block text-sm font-semibold leading-tight hover:text-primary hover:underline"
          >
            {booking.motorModel}
          </Link>
          <p className="truncate text-xs text-muted-foreground">
            {booking.customerName} · {booking.bookingNumber}
          </p>
        </div>
      </header>

      <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
        {booking.serviceName ? (
          <span className="font-medium text-foreground">
            {booking.serviceName}:{" "}
          </span>
        ) : null}
        {booking.complaint}
      </p>

      <footer className="mt-3 flex items-center justify-between gap-2 border-t pt-2.5">
        {needsMechanic ? (
          <button
            type="button"
            onClick={() => onAssign?.(booking)}
            className="flex items-center gap-1 text-xs font-medium text-status-dikerjakan hover:underline"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Tugaskan mekanik
          </button>
        ) : (
          <span className="flex min-w-0 items-center gap-1.5 text-xs">
            <UserAvatar
              name={mechanic ?? "?"}
              className="h-5 w-5 text-[10px]"
            />
            <span className="truncate">{mechanic ?? "Mekanik"}</span>
          </span>
        )}

        <div className="flex shrink-0 items-center gap-1">
          <span className="rounded border px-1 text-[10px] font-medium uppercase text-muted-foreground">
            {booking.bookingType === "online" ? "Online" : "Walk-in"}
          </span>
          {next ? (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 gap-1 px-2 text-xs"
              disabled={pending}
              onClick={() => onAdvance?.(booking)}
              aria-label={`Lanjutkan ${booking.bookingNumber} ke ${next}`}
            >
              {getStatusMeta(next).label}
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          ) : booking.status === "Selesai" ? (
            <Button
              asChild
              size="sm"
              variant="ghost"
              className="h-7 gap-1 px-2 text-xs"
            >
              <Link href={`/staff/${booking._id}`}>
                <Receipt className="h-3.5 w-3.5" />
                Checkout
              </Link>
            </Button>
          ) : null}
        </div>
      </footer>
    </article>
  );
}
