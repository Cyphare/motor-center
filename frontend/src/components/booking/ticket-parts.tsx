"use client";

import * as React from "react";
import { X } from "lucide-react";

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
import { useAddPart, useRemovePart } from "@/hooks/use-mutations";
import { useParts } from "@/hooks/use-queries";
import { formatRupiah } from "@/lib/format";
import type { Booking, ServiceStatus } from "@/types/api";

export const PARTS_EDITABLE_STATUSES: ServiceStatus[] = [
  "Diperiksa",
  "Dikerjakan",
];

export function canEditParts(booking: Booking): boolean {
  return PARTS_EDITABLE_STATUSES.includes(booking.status);
}

export interface TicketPartsProps {
  booking: Booking;
  /** Allow adding/removing (staff and mekanik). Still gated by status. */
  editable?: boolean;
}

/** Parts used on a ticket, with an inline add row while work is open. */
export function TicketParts({ booking, editable = false }: TicketPartsProps) {
  const canEdit = editable && canEditParts(booking);
  const { data: parts = [] } = useParts({}, canEdit);
  const addPart = useAddPart();
  const removePart = useRemovePart();
  const [partId, setPartId] = React.useState("");
  const [quantity, setQuantity] = React.useState("1");

  function handleAdd() {
    const qty = Number(quantity);
    if (!partId || !Number.isInteger(qty) || qty < 1) return;
    addPart.mutate(
      { id: booking._id, data: { partId, quantity: qty } },
      {
        onSuccess: () => {
          setPartId("");
          setQuantity("1");
        },
      }
    );
  }

  return (
    <div className="space-y-4">
      {booking.partsUsed.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Belum ada suku cadang dipakai.
        </p>
      ) : (
        <table className="w-full text-sm">
          <tbody>
            {booking.partsUsed.map((part) => (
              <tr key={part._id} className="border-b last:border-0">
                <td className="py-2 pr-3">
                  {part.name}
                  <span className="ml-2 font-mono text-xs text-muted-foreground">
                    {part.code}
                  </span>
                </td>
                <td className="w-12 py-2 pr-3 text-right tabular-nums text-muted-foreground">
                  ×{part.quantity}
                </td>
                <td className="w-28 py-2 text-right tabular-nums">
                  {formatRupiah(part.subtotal)}
                </td>
                {canEdit && (
                  <td className="w-9 py-1 pl-1 text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() =>
                        removePart.mutate({
                          id: booking._id,
                          partItemId: part._id,
                        })
                      }
                      disabled={removePart.isPending}
                      aria-label={`Batalkan ${part.name}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {canEdit ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1">
            <Label className="text-xs text-muted-foreground">Suku cadang</Label>
            <Select value={partId} onValueChange={setPartId}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih suku cadang" />
              </SelectTrigger>
              <SelectContent>
                {parts.map((part) => (
                  <SelectItem
                    key={part._id}
                    value={part._id}
                    disabled={part.stock <= 0}
                  >
                    {part.name} · stok {part.stock}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full space-y-1 sm:w-20">
            <Label htmlFor="part-qty" className="text-xs text-muted-foreground">
              Jumlah
            </Label>
            <Input
              id="part-qty"
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            onClick={handleAdd}
            disabled={!partId || addPart.isPending}
          >
            Tambah
          </Button>
        </div>
      ) : (
        editable &&
        !canEditParts(booking) && (
          <p className="text-xs text-muted-foreground">
            Suku cadang bisa diubah saat tiket Diperiksa atau Dikerjakan.
          </p>
        )
      )}
    </div>
  );
}
