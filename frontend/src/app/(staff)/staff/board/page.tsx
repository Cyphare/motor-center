"use client";

import * as React from "react";
import Link from "next/link";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { List, Plus, Search } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/page-header";
import { ErrorState } from "@/components/error-state";
import { AssignMechanicDialog } from "@/components/booking/assign-mechanic-dialog";
import { BoardCard } from "@/components/board/board-card";
import { BoardColumn, type DropState } from "@/components/board/board-column";
import { useBoard } from "@/hooks/use-queries";
import { useMoveBooking } from "@/hooks/use-mutations";
import {
  canBoardMove,
  hasMechanic,
  matchesBoardSearch,
  nextBoardStatus,
  sortByWaiting,
  type BoardStatus,
} from "@/lib/board";
import type { Booking, ServiceStatus } from "@/types/api";

/** Re-render once a minute so "time in stage" stays current. */
function useNow(intervalMs = 60_000): Date {
  const [now, setNow] = React.useState(() => new Date());
  React.useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return now;
}

interface PendingAssign {
  booking: Booking;
  /** Move here once a mechanic is assigned (set when the move needed one). */
  thenMoveTo?: ServiceStatus;
}

export default function StaffBoardPage() {
  const board = useBoard();
  const move = useMoveBooking();
  const now = useNow();

  const [search, setSearch] = React.useState("");
  const [dragging, setDragging] = React.useState<Booking | null>(null);
  const [pendingAssign, setPendingAssign] =
    React.useState<PendingAssign | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor)
  );

  const columns = React.useMemo(
    () =>
      board.columns.map((col) => ({
        ...col,
        bookings: sortByWaiting(
          col.bookings.filter((b) => matchesBoardSearch(b, search)),
          now
        ),
      })),
    [board.columns, search, now]
  );

  const requestMove = React.useCallback(
    (booking: Booking, to: ServiceStatus) => {
      if (booking.status === to) return;
      if (!canBoardMove(booking.status, to)) {
        toast.error(
          `Tiket di ${booking.status} tidak bisa langsung dipindah ke ${to}`
        );
        return;
      }
      // Backend rejects Diperiksa without a mechanic: assign first, then move.
      if (to === "Diperiksa" && !hasMechanic(booking)) {
        setPendingAssign({ booking, thenMoveTo: to });
        return;
      }
      move.mutate({ id: booking._id, to });
    },
    [move]
  );

  function handleDragStart(event: DragStartEvent) {
    const booking = event.active.data.current?.booking as Booking | undefined;
    setDragging(booking ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setDragging(null);
    const booking = event.active.data.current?.booking as Booking | undefined;
    const to = event.over?.id as BoardStatus | undefined;
    if (booking && to) requestMove(booking, to);
  }

  function dropStateFor(status: BoardStatus): DropState {
    if (!dragging || dragging.status === status) return "idle";
    return canBoardMove(dragging.status, status) ? "allowed" : "blocked";
  }

  const totalActive = board.columns.reduce((sum, c) => sum + c.total, 0);
  const pendingId = move.isPending ? move.variables?.id : undefined;

  return (
    <main className="flex w-full flex-1 flex-col gap-5 px-4 py-6 sm:px-6 lg:py-8">
      <PageHeader
        title="Papan Kerja"
        description={`${totalActive} tiket aktif`}
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link href="/staff">
                <List className="h-4 w-4" />
                Daftar
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/staff/baru">
                <Plus className="h-4 w-4" />
                Tiket Baru
              </Link>
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari plat, pelanggan, motor..."
            className="pl-9"
            aria-label="Cari tiket di papan"
          />
        </div>
      </div>

      {board.isError ? (
        <ErrorState
          message={
            board.error instanceof Error ? board.error.message : undefined
          }
          onRetry={() => void board.refetch()}
        />
      ) : (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setDragging(null)}
          accessibility={{
            screenReaderInstructions: {
              draggable:
                "Tekan spasi untuk mengangkat kartu, panah untuk memilih kolom, spasi lagi untuk menaruh, Escape untuk batal.",
            },
          }}
        >
          <div className="-mx-4 flex flex-1 snap-x gap-3 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0">
            {columns.map((col) => (
              <BoardColumn
                key={col.status}
                status={col.status}
                count={col.bookings.length}
                total={col.total}
                dropState={dropStateFor(col.status)}
              >
                {board.isLoading ? (
                  <>
                    <Skeleton className="h-36 w-full rounded-md" />
                    <Skeleton className="h-36 w-full rounded-md" />
                  </>
                ) : col.bookings.length === 0 ? (
                  <p className="px-1 py-4 text-xs text-muted-foreground">
                    {search
                      ? "Tidak ada yang cocok"
                      : "Kosong"}
                  </p>
                ) : (
                  col.bookings.map((booking) => (
                    <BoardCard
                      key={booking._id}
                      booking={booking}
                      now={now}
                      pending={booking._id === pendingId}
                      onAdvance={(b) => {
                        const to = nextBoardStatus(b.status);
                        if (to) requestMove(b, to);
                      }}
                      onAssign={(b) => setPendingAssign({ booking: b })}
                    />
                  ))
                )}
              </BoardColumn>
            ))}
          </div>

          <DragOverlay dropAnimation={null}>
            {dragging ? (
              <BoardCard booking={dragging} now={now} overlay />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      <AssignMechanicDialog
        booking={pendingAssign?.booking ?? null}
        onOpenChange={(open) => {
          if (!open) setPendingAssign(null);
        }}
        reason={
          pendingAssign?.thenMoveTo
            ? `Tiket perlu mekanik sebelum masuk ${pendingAssign.thenMoveTo}. Setelah ditugaskan, tiket langsung dipindahkan.`
            : undefined
        }
        onAssigned={(updated) => {
          const to = pendingAssign?.thenMoveTo;
          setPendingAssign(null);
          if (to) move.mutate({ id: updated._id, to });
        }}
      />
    </main>
  );
}
