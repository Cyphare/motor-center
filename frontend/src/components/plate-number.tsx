import { cn } from "@/lib/utils";

export interface PlateNumberProps {
  plate: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * Normalize a plate for display: uppercase and single spaces, e.g.
 * "b 1234  xyz" -> "B 1234 XYZ".
 */
export function formatPlate(plate: string): string {
  return plate.trim().replace(/\s+/g, " ").toUpperCase();
}

const SIZE_CLASS = {
  sm: "px-1.5 py-0 text-xs",
  md: "px-2 py-0.5 text-sm",
  lg: "px-3 py-1 text-xl",
} as const;

/**
 * An Indonesian-style number plate chip: condensed bold characters inside a
 * rounded double border. Used wherever a ticket is identified by its motor.
 */
export function PlateNumber({ plate, size = "md", className }: PlateNumberProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-[4px] border-2 border-foreground/85 bg-card font-display font-bold uppercase tracking-wider text-foreground",
        SIZE_CLASS[size],
        className
      )}
    >
      {formatPlate(plate)}
    </span>
  );
}
