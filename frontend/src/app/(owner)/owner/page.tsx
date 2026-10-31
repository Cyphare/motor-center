"use client";

import {
  Banknote,
  CalendarRange,
  CheckCircle2,
  ClipboardList,
  AlertTriangle,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { DataTable } from "@/components/data-table";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { TableSkeleton } from "@/components/loading-state";
import { Badge } from "@/components/ui/badge";
import { useDashboard } from "@/hooks/use-queries";
import { formatRupiah } from "@/lib/format";
import type { DashboardLowStockPart } from "@/types/api";

export default function OwnerDashboardPage() {
  const { data, isLoading, isError, error, refetch } = useDashboard();

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
      <PageHeader
        title="Dasbor Pemilik"
        description="Ringkasan omzet, tiket aktif, dan stok suku cadang hari ini (zona waktu WIB)."
      />

      <div className="mt-8">
        {isLoading ? (
          <TableSkeleton rows={4} columns={2} />
        ) : isError ? (
          <ErrorState
            message={error instanceof Error ? error.message : undefined}
            onRetry={() => refetch()}
          />
        ) : data ? (
          <div className="space-y-8">
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="Omzet Hari Ini"
                value={formatRupiah(data.revenueToday)}
                icon={<Banknote className="h-4 w-4" />}
                hint={`Per ${data.date} (WIB)`}
              />
              <StatCard
                label="Omzet Bulan Ini"
                value={formatRupiah(data.revenueMonth)}
                icon={<CalendarRange className="h-4 w-4" />}
              />
              <StatCard
                label="Selesai Hari Ini"
                value={data.completedToday}
                icon={<CheckCircle2 className="h-4 w-4" />}
                hint="Tiket yang diselesaikan hari ini"
              />
              <StatCard
                label="Stok Menipis"
                value={data.lowStockParts.length}
                icon={<AlertTriangle className="h-4 w-4" />}
                hint="Jenis suku cadang di bawah batas"
              />
            </section>

            <section>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <ClipboardList className="h-4 w-4" />
                Tiket Aktif
              </h2>
              <div className="grid gap-4 sm:grid-cols-3">
                <StatCard label="Antre" value={data.activeTickets.Antre} />
                <StatCard
                  label="Diperiksa"
                  value={data.activeTickets.Diperiksa}
                />
                <StatCard
                  label="Dikerjakan"
                  value={data.activeTickets.Dikerjakan}
                />
              </div>
            </section>

            <section>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    Suku Cadang Menipis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {data.lowStockParts.length === 0 ? (
                    <EmptyState
                      title="Stok aman"
                      description="Tidak ada suku cadang yang berada di bawah batas minimum."
                    />
                  ) : (
                    <DataTable<DashboardLowStockPart>
                      columns={[
                        {
                          key: "code",
                          header: "Kode",
                          cell: (part) => (
                            <span className="font-mono text-xs">
                              {part.code}
                            </span>
                          ),
                        },
                        {
                          key: "name",
                          header: "Nama",
                          cell: (part) => part.name,
                        },
                        {
                          key: "stock",
                          header: "Stok",
                          cell: (part) => (
                            <span className="flex items-center gap-2">
                              {part.stock} {part.unit}
                              <Badge
                                variant="outline"
                                className="border-red-200 bg-red-50 text-red-700"
                              >
                                <AlertTriangle className="mr-1 h-3 w-3" />
                                Menipis
                              </Badge>
                            </span>
                          ),
                        },
                        {
                          key: "minStock",
                          header: "Min",
                          cell: (part) => part.minStock,
                        },
                      ]}
                      rows={data.lowStockParts}
                      getRowId={(part) => part._id}
                    />
                  )}
                </CardContent>
              </Card>
            </section>
          </div>
        ) : null}
      </div>
    </main>
  );
}
