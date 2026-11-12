import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

export const LOGO_SRC = "/Motor-Center_logo.png";

export interface BrandProps {
  href?: string;
  className?: string;
  /** Hide the wordmark and show only the logo mark. */
  markOnly?: boolean;
}

/** Official logo mark plus the MotorCenter wordmark. */
export function Brand({ href = "/", className, markOnly }: BrandProps) {
  return (
    <Link
      href={href}
      aria-label="MotorCenter"
      className={cn(
        "inline-flex items-center gap-2 font-display text-xl font-bold uppercase leading-none tracking-wide",
        className
      )}
    >
      {/* Source is 205x240; height follows the text size. */}
      <Image
        src={LOGO_SRC}
        alt=""
        width={205}
        height={240}
        priority
        className="h-[1.4em] w-auto"
      />
      {!markOnly && (
        <span>
          Motor<span className="text-primary">Center</span>
        </span>
      )}
    </Link>
  );
}
