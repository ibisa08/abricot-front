import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Passe l'input en état d'erreur (bordure rouge + aria-invalid). */
  invalid?: boolean;
}

/**
 * Champ texte accessible. `aria-invalid` est posé automatiquement en cas d'erreur ;
 * relier `aria-describedby` à l'id du message d'erreur côté formulaire.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, invalid, "aria-invalid": ariaInvalid, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      aria-invalid={ariaInvalid ?? invalid ?? undefined}
      className={cn(
        "h-11 w-full rounded-lg border bg-surface px-3.5 text-sm text-text",
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
