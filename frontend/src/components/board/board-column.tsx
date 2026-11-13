"use client";

import { useDroppable } from "@dnd-kit/core";

import { BOARD_COLUMN_LIMIT, type BoardStatus } from "@/lib/board";
import { getStatusMeta } from "@/lib/status-meta";
import { cn } from "@/lib/utils";

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
  const truncated = total > BOARD_COLUMN_LIMIT;

  return (
    <section
      ref={setNodeRef}
      aria-label={`Kolom ${meta.label}`}
      className={cn(
        "flex w-[82vw] max-w-sm shrink-0 snap-start flex-col rounded-md bg-muted/60 transition-colors sm:w-80 lg:w-auto lg:max-w-none",
        dropState === "allowed" && "outline-2 outline-dashed outline-status-selesai",
        dropState === "allowed" && isOver && "bg-status-selesai/10",
        dropState === "blocked" && "opacity-50"
      )}
    >
      <header className="flex items-center gap-2 px-3 pb-2 pt-3">
        <span
          aria-hidden
          className={cn("h-2.5 w-2.5 rounded-[1px]", meta.solidClass)}
        />
        <h2 className="font-display text-base font-bold uppercase tracking-wide">
          {meta.label}
        </h2>
        <span className="ml-auto text-sm font-semibold tabular-nums text-muted-foreground">
          {truncated ? `${count}/${total}` : count}
        </span>
      </header>
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
