"use client";

import * as React from "react";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { DataTable } from "@/components/data-table";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { TableSkeleton } from "@/components/loading-state";
import { useRevenue } from "@/hooks/use-queries";
import type { RevenueQuery } from "@/services/reports";
import type { RevenueDay } from "@/types/api";
import { formatDate, formatRupiah } from "@/lib/format";
import { validateDateRange } from "@/lib/validations";

export default function OwnerRevenuePage() {
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  // The query that is actually sent, only updated when the range is valid.
  const [appliedQuery, setAppliedQuery] = React.useState<RevenueQuery>({});
  const [formError, setFormError] = React.useState<string | null>(null);

  const { data, isLoading, isError, error, refetch } = useRevenue(appliedQuery);

  function handleApply() {
    const validationError = validateDateRange(startDate, endDate, {
      requireBoth: true,
    });
    setFormError(validationError);
    if (validationError) return;
    setAppliedQuery(
      startDate && endDate ? { startDate, endDate } : {}
    );
  }

  const days = data?.days ?? [];

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <PageHeader
        title="Laporan Omzet"
        description="Dihitung dari tanggal motor diambil, per hari (WIB)."
      />

      <Card className="mt-6">
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <div className="space-y-2">
            <Label htmlFor="startDate">Dari tanggal</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate">Sampai tanggal</Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
            />
          </div>
          <Button onClick={handleApply} className="sm:w-auto">
            <Search className="mr-1 h-4 w-4" />
            Terapkan
          </Button>
        </CardContent>
      </Card>

      {formError && (
        <p className="mt-3 text-sm text-destructive" role="alert">
          {formError}
        </p>
      )}

      <div className="mt-8 space-y-6">
        {isLoading ? (
          <TableSkeleton rows={5} columns={4} />
        ) : isError ? (
          <ErrorState
            message={error instanceof Error ? error.message : undefined}
            onRetry={() => refetch()}
          />
        ) : data ? (
          <>
            <section className="grid gap-4 sm:grid-cols-3">
              <StatCard
                label="Omzet Jasa"
                value={formatRupiah(data.serviceTotal)}
              />
              <StatCard
                label="Omzet Suku Cadang"
                value={formatRupiah(data.partsTotal)}
              />
              <StatCard
                label="Total Omzet"
                value={formatRupiah(data.revenue)}
                hint={`${formatDate(data.startDate)} - ${formatDate(data.endDate)}`}
              />
            </section>

            {days.length === 0 ? (
              <EmptyState
                title="Tidak ada transaksi"
                description="Tidak ada motor yang diambil pada rentang tanggal ini."
              />
            ) : (
              <DataTable<RevenueDay>
                columns={[
                  {
                    key: "date",
                    header: "Tanggal",
                    cell: (day) => formatDate(day.date),
                  },
                  {
                    key: "ticketCount",
                    header: "Tiket",
                    cell: (day) => day.ticketCount,
                  },
                  {
                    key: "serviceTotal",
                    header: "Jasa",
                    cell: (day) => formatRupiah(day.serviceTotal),
                  },
                  {
                    key: "partsTotal",
                    header: "Suku Cadang",
                    cell: (day) => formatRupiah(day.partsTotal),
                  },
                  {
                    key: "revenue",
                    header: "Omzet",
                    className: "font-medium",
                    cell: (day) => formatRupiah(day.revenue),
                  },
                ]}
                rows={days}
                getRowId={(day) => day.date}
              />
            )}
          </>
        ) : null}
      </div>
    </main>
  );
}
