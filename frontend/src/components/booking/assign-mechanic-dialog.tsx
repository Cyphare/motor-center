"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlateNumber } from "@/components/plate-number";
import { useAssignMechanic } from "@/hooks/use-mutations";
import { useMechanics } from "@/hooks/use-queries";
import type { Booking } from "@/types/api";

export interface AssignMechanicDialogProps {
  booking: Booking | null;
  onOpenChange: (open: boolean) => void;
  /** Extra line explaining why the dialog opened (e.g. before Diperiksa). */
  reason?: string;
  onAssigned?: (booking: Booking) => void;
}

/** Pick an active mechanic for a ticket (PUT /bookings/:id/assign). */
export function AssignMechanicDialog({
  booking,
  onOpenChange,
  reason,
  onAssigned,
}: AssignMechanicDialogProps) {
  const open = booking !== null;
  const { data: mechanics = [], isLoading } = useMechanics(open);
  const assign = useAssignMechanic();
  const [mechanicId, setMechanicId] = React.useState("");

  function handleOpenChange(next: boolean) {
    if (!next) setMechanicId("");
    onOpenChange(next);
  }

  function handleSubmit() {
    if (!booking || !mechanicId) return;
    assign.mutate(
      { id: booking._id, mechanicId },
      {
        onSuccess: (updated) => {
          handleOpenChange(false);
          onAssigned?.(updated);
        },
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tugaskan mekanik</DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-2">
              {booking && (
                <p className="flex flex-wrap items-center gap-2">
                  {booking.bookingNumber}
                  <PlateNumber plate={booking.plateNumber} size="sm" />
                  {booking.motorModel}
                </p>
              )}
              {reason && <p>{reason}</p>}
            </div>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="assign-mechanic">Mekanik</Label>
          <Select value={mechanicId} onValueChange={setMechanicId}>
            <SelectTrigger id="assign-mechanic">
              <SelectValue
                placeholder={isLoading ? "Memuat mekanik..." : "Pilih mekanik"}
              />
            </SelectTrigger>
            <SelectContent>
              {mechanics.map((m) => (
                <SelectItem key={m._id} value={m._id}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Batal
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!mechanicId || assign.isPending}
          >
            {assign.isPending ? "Menyimpan..." : "Tugaskan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
