"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, Wrench } from "lucide-react";

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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
      <PageHeader
        title="Antrean Servis"
        description="Semua tiket servis bengkel. Gunakan filter untuk mempersempit (zona waktu WIB)."
        actions={
          <Button asChild size="sm">
            <Link href="/staff/baru">
              <Plus className="mr-1 h-4 w-4" />
              Tiket Baru
            </Link>
          </Button>
        }
      />

      <Card className="mt-6">
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
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
          <div className="space-y-2">
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
          <div className="space-y-2">
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
          <div className="space-y-2">
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
          <div className="space-y-2">
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
          <div className="space-y-2">
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
        </CardContent>
      </Card>

      {rangeError && (
        <p className="mt-3 text-sm text-red-600" role="alert">
          {rangeError}
        </p>
      )}

      <div className="mt-6">
        {rangeError ? (
          <EmptyState
            icon={<Wrench className="h-8 w-8" />}
            title="Rentang tanggal tidak valid"
            description={rangeError}
          />
        ) : isLoading ? (
          <TableSkeleton rows={5} columns={1} />
        ) : isError ? (
          <ErrorState
            message={error instanceof Error ? error.message : undefined}
            onRetry={() => refetch()}
          />
        ) : bookings.length === 0 ? (
          <EmptyState
            icon={<Wrench className="h-8 w-8" />}
            title="Tidak ada tiket"
            description="Belum ada tiket yang cocok dengan filter ini."
          />
        ) : (
          <div className="grid gap-4">
            {bookings.map((booking) => (
              <Link key={booking._id} href={`/staff/${booking._id}`}>
                <Card className="transition-colors hover:border-primary/50">
                  <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                    <div className="space-y-1">
                      <CardTitle className="text-base">
                        {booking.bookingNumber}
                      </CardTitle>
                      <p className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
                        <PlateNumber plate={booking.plateNumber} size="sm" /> {booking.motorModel} &middot;{" "}
                        {booking.customerName}
                      </p>
                    </div>
                    <StatusBadge status={booking.status} />
                  </CardHeader>
                  <CardContent className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
                    <span className="line-clamp-1 max-w-sm">
                      {booking.complaint}
                    </span>
                    <span className="flex items-center gap-3">
                      <span className="rounded border px-2 py-0.5 text-xs uppercase">
                        {booking.bookingType}
                      </span>
                      <span>
                        {formatDate(booking.serviceDate ?? booking.createdAt)}
                      </span>
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
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
