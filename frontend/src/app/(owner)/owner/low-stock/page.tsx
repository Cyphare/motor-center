"use client";

import { Indicator } from "@/components/indicator";

import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { TableSkeleton } from "@/components/loading-state";
import { useLowStockParts } from "@/hooks/use-queries";
import { formatRupiah } from "@/lib/format";
import type { Part } from "@/types/api";

function isLowStock(part: Part): boolean {
  return part.isLowStock ?? part.stock <= part.minStock;
}

export default function OwnerLowStockPage() {
  const { data, isLoading, isError, error, refetch } = useLowStockParts();
  const parts = data ?? [];

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <PageHeader
        title="Suku Cadang Menipis"
        description="Stok di bawah atau sama dengan batas minimum."
      />

      <div className="mt-8">
        {isLoading ? (
          <TableSkeleton rows={5} columns={5} />
        ) : isError ? (
          <ErrorState
            message={error instanceof Error ? error.message : undefined}
            onRetry={() => refetch()}
          />
        ) : parts.length === 0 ? (
          <EmptyState
            title="Stok aman"
            description="Tidak ada suku cadang yang perlu segera diisi ulang."
          />
        ) : (
          <DataTable
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
                cell: (part) => (
                  <span className="flex items-center gap-2">
                    {part.stock} {part.unit}
                    {isLowStock(part) && (
                      <Indicator tone="danger">Menipis</Indicator>
                    )}
                  </span>
                ),
              },
              {
                key: "minStock",
                header: "Min",
                cell: (part) => part.minStock,
              },
              {
                key: "price",
                header: "Harga",
                cell: (part) => formatRupiah(part.price),
              },
            ]}
            rows={parts}
            getRowId={(part) => part._id}
          />
        )}
      </div>
    </main>
  );
}
