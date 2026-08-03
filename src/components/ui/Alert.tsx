import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * - `warning` : problème ou échec — palette de statut « à faire ».
 * - `info`    : information neutre — tokens de surface secondaire.
 */
export type AlertTone = "warning" | "info";

const TONE_CLASSES: Record<AlertTone, string> = {
  // #c01827 sur #ffe0e0 à 50 % → 5.58:1 sur carte blanche (AA)
  warning: "border-status-todo-fg/30 bg-status-todo-bg/50 text-status-todo-fg",
  // #5d6470 sur #f3f4f6 → 5.42:1 (AA)
  info: "border-border bg-surface-alt text-text-muted",
};

export interface AlertProps {
  /** Contenu du message (texte court, compréhensible sans contexte technique). */
  children: ReactNode;
  /** Tonalité visuelle. Défaut `warning` : les usages existants sont inchangés. */
  tone?: AlertTone;
  /**
   * Rôle ARIA. Par défaut aligné sur la tonalité : `alert` (annonce immédiate,
   * aria-live assertive) pour un avertissement, `status` (annonce non
   * interruptive, aria-live polite) pour une information neutre.
   * À surcharger uniquement si le contexte l'exige.
   */
  role?: "alert" | "status";
  className?: string;
}

/**
 * Bandeau de message inline des formulaires.
 * Les deux tonalités reposent sur des tokens du design system dont le
 * contraste texte/fond est conforme AA — voir docs/DESIGN.md §2.
 */
export function Alert({ children, tone = "warning", role, className }: AlertProps) {
  const resolvedRole = role ?? (tone === "info" ? "status" : "alert");

  return (
    <p
      role={resolvedRole}
      aria-live={resolvedRole === "alert" ? "assertive" : "polite"}
      className={cn(
        "rounded-lg border px-3.5 py-2.5 text-sm font-medium",
        TONE_CLASSES[tone],
        className,
      )}
    >
      {children}
    </p>
  );
}
