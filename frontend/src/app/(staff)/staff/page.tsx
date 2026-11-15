"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, SquareKanban } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { PlateNumber } from "@/components/plate-number";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { TableSkeleton } from "@/components/loading-state";
import { useBookings, useMechanics } from "@/hooks/use-queries";
import type { BookingListQuery } from "@/services/bookings";
import type { BookingType, ServiceStatus } from "@/types/api";
import { formatDate } from "@/lib/format";
import { validateDateRange } from "@/lib/validations";

const STATUSES: ServiceStatus[] = [
  "Antre",
  "Diperiksa",
  "Dikerjakan",
  "Selesai",
  "Diambil",
  "Dibatalkan",
];

const BOOKING_TYPES: { label: string; value: BookingType }[] = [
  { label: "Walk-in", value: "walk-in" },
  { label: "Online", value: "online" },
];

const ANY = "__any__";
const PAGE_SIZE = 10;

export default function StaffQueuePage() {
  const [status, setStatus] = React.useState<string>(ANY);
  const [bookingType, setBookingType] = React.useState<string>(ANY);
  const [mechanicId, setMechanicId] = React.useState<string>(ANY);
  const [plateNumber, setPlateNumber] = React.useState("");
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [page, setPage] = React.useState(1);

  const { data: mechanicsData } = useMechanics();
  const mechanics = mechanicsData ?? [];

  const rangeError = validateDateRange(startDate, endDate);

  const query: BookingListQuery = React.useMemo(() => {
    const q: BookingListQuery = { page, limit: PAGE_SIZE };
    if (status !== ANY) q.status = status as ServiceStatus;
    if (bookingType !== ANY) q.bookingType = bookingType as BookingType;
    if (mechanicId !== ANY) q.mechanicId = mechanicId;
    if (plateNumber.trim()) q.plateNumber = plateNumber.trim();
    if (!rangeError) {
      if (startDate) q.startDate = startDate;
      if (endDate) q.endDate = endDate;
    }
    return q;
  }, [
    page,
    status,
    bookingType,
    mechanicId,
    plateNumber,
    startDate,
    endDate,
    rangeError,
  ]);

  const { data, isLoading, isError, error, refetch } = useBookings(
    query,
    !rangeError
  );
  const bookings = data?.data ?? [];
  const pagination = data?.pagination;

  // Any filter change returns to the first page so results stay coherent.
  function resetToFirstPage<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value);
      setPage(1);
    };
  }

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:py-8">
      <PageHeader
        title="Antrean"
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link href="/staff/board">
                <SquareKanban className="mr-1 h-4 w-4" />
                Papan
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/staff/baru">
                <Plus className="mr-1 h-4 w-4" />
                Tiket Baru
              </Link>
            </Button>
          </>
        }
      />

      <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-6 [&_label]:text-xs [&_label]:uppercase [&_label]:tracking-wider [&_label]:text-muted-foreground">
          <div className="space-y-1">
            <Label>Status</Label>
            <Select value={status} onValueChange={resetToFirstPage(setStatus)}>
              <SelectTrigger>
                <SelectValue placeholder="Semua status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>Semua status</SelectItem>
                {STATUSES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Tipe tiket</Label>
            <Select
              value={bookingType}
              onValueChange={resetToFirstPage(setBookingType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Semua tipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>Semua tipe</SelectItem>
                {BOOKING_TYPES.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Mekanik</Label>
            <Select
              value={mechanicId}
              onValueChange={resetToFirstPage(setMechanicId)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Semua mekanik" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>Semua mekanik</SelectItem>
                {mechanics.map((mechanic) => (
                  <SelectItem key={mechanic._id} value={mechanic._id}>
                    {mechanic.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="plateNumber">Nomor plat</Label>
            <Input
              id="plateNumber"
              value={plateNumber}
              onChange={(event) =>
                resetToFirstPage(setPlateNumber)(event.target.value)
              }
              placeholder="B 1234 ABC"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="startDate">Dari tanggal</Label>
            <Input
              id="startDate"
              type="date"
              max={endDate || undefined}
              value={startDate}
              onChange={(event) =>
                resetToFirstPage(setStartDate)(event.target.value)
              }
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="endDate">Sampai tanggal</Label>
            <Input
              id="endDate"
              type="date"
              min={startDate || undefined}
              value={endDate}
              onChange={(event) =>
                resetToFirstPage(setEndDate)(event.target.value)
              }
            />
          </div>
      </div>

      {rangeError && (
        <p className="mt-3 text-sm text-destructive" role="alert">
          {rangeError}
        </p>
      )}

      <div className="mt-6">
        {rangeError ? (
          <EmptyState
            title="Rentang tanggal tidak valid"
            description={rangeError}
          />
        ) : isLoading ? (
          <TableSkeleton rows={5} columns={7} />
        ) : isError ? (
          <ErrorState
            message={error instanceof Error ? error.message : undefined}
            onRetry={() => refetch()}
          />
        ) : bookings.length === 0 ? (
          <EmptyState
            title="Tidak ada tiket"
            description="Belum ada tiket yang cocok dengan filter ini."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-foreground text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="py-2 pr-3 font-semibold">Tiket</th>
                  <th className="py-2 pr-3 font-semibold">Motor</th>
                  <th className="py-2 pr-3 font-semibold">Pelanggan</th>
                  <th className="py-2 pr-3 font-semibold">Keluhan</th>
                  <th className="py-2 pr-3 font-semibold">Tipe</th>
                  <th className="py-2 pr-3 font-semibold">Tanggal</th>
                  <th className="py-2 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr
                    key={booking._id}
                    className="group relative border-b align-top hover:bg-muted/50"
                  >
                    <td className="py-2.5 pr-3">
                      <Link
                        href={`/staff/${booking._id}`}
                        className="font-medium tabular-nums after:absolute after:inset-0 group-hover:text-primary"
                      >
                        {booking.bookingNumber}
                      </Link>
                    </td>
                    <td className="py-2.5 pr-3">
                      <PlateNumber plate={booking.plateNumber} size="sm" />
                      <p className="mt-1 text-muted-foreground">
                        {booking.motorModel}
                      </p>
                    </td>
                    <td className="py-2.5 pr-3">{booking.customerName}</td>
                    <td className="max-w-64 py-2.5 pr-3 text-muted-foreground">
                      <span className="line-clamp-2">{booking.complaint}</span>
                    </td>
                    <td className="py-2.5 pr-3 text-muted-foreground">
                      {booking.bookingType === "online" ? "Online" : "Walk-in"}
                    </td>
                    <td className="whitespace-nowrap py-2.5 pr-3 tabular-nums text-muted-foreground">
                      {formatDate(booking.serviceDate ?? booking.createdAt)}
                    </td>
                    <td className="py-2.5">
                      <StatusBadge status={booking.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!rangeError && pagination && pagination.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Halaman {pagination.page} dari {pagination.totalPages} &middot;{" "}
            {pagination.total} tiket
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPage((current) => current + 1)}
            >
              Berikutnya
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}
