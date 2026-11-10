"use client";

import { useDroppable } from "@dnd-kit/core";

import { BOARD_COLUMN_LIMIT, type BoardStatus } from "@/lib/board";
import { getStatusMeta } from "@/lib/status-meta";
import { cn } from "@/lib/utils";

/** Accent bar color per column, written literally for Tailwind. */
const ACCENT: Record<BoardStatus, string> = {
  Antre: "bg-status-antre",
  Diperiksa: "bg-status-diperiksa",
  Dikerjakan: "bg-status-dikerjakan",
  Selesai: "bg-status-selesai",
};

export type DropState = "idle" | "allowed" | "blocked";

export interface BoardColumnProps {
  status: BoardStatus;
  count: number;
  total: number;
  dropState: DropState;
  children: React.ReactNode;
}

export function BoardColumn({
  status,
  count,
  total,
  dropState,
  children,
}: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const meta = getStatusMeta(status);
  const Icon = meta.icon;
  const truncated = total > BOARD_COLUMN_LIMIT;

  return (
    <section
      ref={setNodeRef}
      aria-label={`Kolom ${meta.label}`}
      className={cn(
        "flex w-[82vw] max-w-sm shrink-0 snap-start flex-col rounded-xl border bg-muted/50 transition-colors sm:w-80 lg:w-auto lg:max-w-none",
        dropState === "allowed" && "border-dashed border-status-selesai",
        dropState === "allowed" && isOver && "bg-status-selesai/10",
        dropState === "blocked" && "opacity-50"
      )}
    >
      <div className={cn("h-1 rounded-t-xl", ACCENT[status])} />
      <header className="flex items-center gap-2 px-3 py-2.5">
        <Icon className={cn("h-4 w-4", meta.textClass)} />
        <h2 className="font-display text-base font-bold uppercase tracking-wide">
          {meta.label}
        </h2>
        <span className="ml-auto rounded-full bg-background px-2 py-0.5 text-xs font-semibold tabular-nums">
          {truncated ? `${count}/${total}` : count}
        </span>
      </header>
      <p className="-mt-1.5 px-3 pb-2 text-[11px] text-muted-foreground">
        {meta.description}
      </p>
      <div className="flex min-h-24 flex-1 flex-col gap-2 overflow-y-auto px-2 pb-2 lg:max-h-[calc(100svh-15rem)]">
        {children}
      </div>
      {truncated && (
        <p className="border-t px-3 py-2 text-[11px] text-muted-foreground">
          Menampilkan {BOARD_COLUMN_LIMIT} tiket terbaru. Gunakan tampilan
          daftar untuk sisanya.
        </p>
      )}
    </section>
  );
}
