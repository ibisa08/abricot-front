import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * Variants (docs/DESIGN.md §4) :
 *  - ink    : noir plein — actions primaires
 *  - accent : orange — ✦ IA, liens forts
 *  - soft   : fond orange clair — onglet actif
 *  - ghost  : transparent — actions discrètes
 */
export type ButtonVariant = "ink" | "accent" | "soft" | "ghost";
export type ButtonSize = "sm" | "md";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  ink: "bg-ink text-white hover:bg-ink-hover",
  accent: "bg-primary text-white hover:bg-primary-hover",
  soft: "bg-primary-soft text-primary hover:bg-primary-soft/80",
  ghost: "bg-transparent text-text hover:bg-black/5",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-5 text-sm",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "ink", size = "md", type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors",
        "disabled:pointer-events-none disabled:opacity-50",
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className,
      )}
      {...props}
    />
  );
});
