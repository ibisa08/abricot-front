import { forwardRef, type LabelHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/** Label de formulaire. Toujours lié à un champ via `htmlFor`. */
export const Label = forwardRef<HTMLLabelElement, LabelHTMLAttributes<HTMLLabelElement>>(
  function Label({ className, ...props }, ref) {
    return (
      <label
        ref={ref}
        className={cn("mb-1.5 block text-sm font-medium text-text", className)}
        {...props}
      />
    );
  },
);
