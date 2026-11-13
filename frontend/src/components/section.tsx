import * as React from "react";

import { cn } from "@/lib/utils";

export interface SectionProps {
  title: string;
  actions?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

/**
 * A titled block separated by a rule instead of a card. Use it to group
 * content on a page without boxing everything.
 */
export function Section({ title, actions, className, children }: SectionProps) {
  return (
    <section className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between gap-3 border-b pb-1.5">
        <h2 className="font-display text-sm font-bold uppercase tracking-wider text-muted-foreground">
          {title}
        </h2>
        {actions}
      </div>
      {children}
    </section>
  );
}
