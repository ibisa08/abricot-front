import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Passe le champ en état d'erreur (bordure rouge + aria-invalid). */
  invalid?: boolean;
}

/** Zone de texte multiligne accessible. */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, invalid, "aria-invalid": ariaInvalid, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      aria-invalid={ariaInvalid ?? invalid ?? undefined}
      className={cn(
        "min-h-24 w-full rounded-lg border bg-surface px-3.5 py-2.5 text-sm text-text",
        "placeholder:text-text-muted",
        "focus-visible:border-primary",
        "disabled:cursor-not-allowed disabled:opacity-50",
        invalid ? "border-status-todo-fg" : "border-border",
        className,
      )}
      {...props}
    />
  );
});
