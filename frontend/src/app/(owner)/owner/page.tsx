"use client";

import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { Section } from "@/components/section";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { DataTable } from "@/components/data-table";
import { ErrorState } from "@/components/error-state";
import { TableSkeleton } from "@/components/loading-state";
import { useDashboard } from "@/hooks/use-queries";
import { formatRupiah } from "@/lib/format";
import type { DashboardLowStockPart } from "@/types/api";

const ACTIVE = ["Antre", "Diperiksa", "Dikerjakan"] as const;

export default function OwnerDashboardPage() {
  const { data, isLoading, isError, error, refetch } = useDashboard();

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:py-8">
      <PageHeader
        title="Dasbor"
        description={data ? `Per ${data.date}, WIB` : undefined}
      />

      <div className="mt-6">
        {isLoading ? (
          <TableSkeleton rows={4} columns={2} />
        ) : isError ? (
          <ErrorState
            message={error instanceof Error ? error.message : undefined}
            onRetry={() => refetch()}
          />
        ) : data ? (
          <div className="space-y-10">
            <div className="grid grid-cols-2 gap-y-6 border-b pb-6 lg:grid-cols-4 lg:divide-x">
              <StatCard
                label="Omzet hari ini"
                value={formatRupiah(data.revenueToday)}
                className="pr-4"
              />
              <StatCard
                label="Omzet bulan ini"
                value={formatRupiah(data.revenueMonth)}
                className="pr-4 lg:pl-6"
              />
              <StatCard
                label="Selesai hari ini"
                value={data.completedToday}
                hint="tiket"
                className="pr-4 lg:pl-6"
              />
              <StatCard
                label="Stok menipis"
                value={data.lowStockParts.length}
                hint="jenis suku cadang"
                className="lg:pl-6"
              />
            </div>

            <Section title="Tiket aktif">
              <div className="grid grid-cols-3 sm:max-w-xl">
                {ACTIVE.map((status) => (
                  <div key={status} className="space-y-1">
                    <StatusBadge status={status} />
                    <p className="font-display text-3xl font-bold tabular-nums">
                      {data.activeTickets[status]}
                    </p>
                  </div>
                ))}
              </div>
            </Section>

            <Section
              title="Suku cadang menipis"
              actions={
                <Link
                  href="/owner/low-stock"
                  className="text-xs font-medium underline underline-offset-4 hover:text-primary"
                >
                  Lihat semua
                </Link>
              }
            >
              {data.lowStockParts.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Semua stok di atas batas minimum.
                </p>
              ) : (
                <DataTable<DashboardLowStockPart>
                  columns={[
                    {
                      key: "code",
                      header: "Kode",
                      cell: (part) => (
                        <span className="font-mono text-xs">{part.code}</span>
                      ),
                    },
                    { key: "name", header: "Nama", cell: (part) => part.name },
                    {
                      key: "stock",
                      header: "Stok",
                      className: "text-right",
                      cell: (part) => (
                        <span className="font-semibold tabular-nums text-destructive">
                          {part.stock} {part.unit}
                        </span>
                      ),
                    },
                    {
                      key: "minStock",
                      header: "Minimum",
                      className: "text-right",
                      cell: (part) => (
                        <span className="tabular-nums text-muted-foreground">
                          {part.minStock}
                        </span>
                      ),
                    },
                  ]}
                  rows={data.lowStockParts}
                  getRowId={(part) => part._id}
                />
              )}
            </Section>
          </div>
        ) : null}
      </div>
    </main>
  );
}
