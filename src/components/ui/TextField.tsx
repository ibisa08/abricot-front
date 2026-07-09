"use client";

import { forwardRef, useId, useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "./Label";
import { Input } from "./Input";

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "id"> {
  /** Libellé du champ (rendu dans un `<label htmlFor>`). */
  label: string;
  /** Message d'erreur — lie `aria-invalid` + `aria-describedby` et le colore. */
  error?: string;
  /** Aide contextuelle affichée sous le champ (ex. règle mot de passe). */
  hint?: string;
  /** Id explicite (sinon généré via `useId`). */
  id?: string;
}

/**
 * Champ de formulaire accessible : `<label>` lié, message d'aide + message
 * d'erreur reliés via `aria-describedby`, `aria-invalid` en erreur.
 * Pour `type="password"`, ajoute un bouton afficher/masquer le mot de passe.
 *
 * Compatible react-hook-form : `<TextField {...register("email")} />` — le `ref`
 * fourni par RHF est capté par `forwardRef`.
 */
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, error, hint, id, type = "text", className, ...props },
  ref,
) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const errorId = `${fieldId}-error`;
  const hintId = `${fieldId}-hint`;

  const [reveal, setReveal] = useState(false);
  const isPassword = type === "password";

  const describedBy =
    [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ") || undefined;

  return (
    <div>
      <Label htmlFor={fieldId}>{label}</Label>
      <div className="relative">
        <Input
          id={fieldId}
          ref={ref}
          type={isPassword && reveal ? "text" : type}
          invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={cn(isPassword && "pr-11", className)}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setReveal((v) => !v)}
            aria-label={reveal ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            aria-pressed={reveal}
            tabIndex={-1}
            className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-text-muted transition-colors hover:text-text"
          >
            {reveal ? (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        )}
      </div>
      {hint && (
        <p id={hintId} className="mt-1.5 text-xs text-text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-xs font-medium text-status-todo-fg">
          {error}
        </p>
      )}
    </div>
  );
});
