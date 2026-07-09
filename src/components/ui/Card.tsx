import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * Carte de surface : fond blanc, `rounded-2xl`, bordure 1px, ombre très légère
 * (docs/DESIGN.md §2).
 */
export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function Card(
  { className, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn("rounded-2xl border border-border bg-surface shadow-card", className)}
      {...props}
    />
  );
});
