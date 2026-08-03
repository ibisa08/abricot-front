import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface AlertProps {
  /** Contenu du message (texte court, compréhensible sans contexte technique). */
  children: ReactNode;
  /**
   * `alert` (défaut) : erreur, annoncée immédiatement (aria-live assertive implicite).
   * `status` : information neutre, annoncée sans interrompre (aria-live polite).
   */
  role?: "alert" | "status";
  className?: string;
}

/**
 * Bandeau de message inline des formulaires.
 * Reprend les tokens de statut « à faire » (orange sombre sur fond clair),
 * conformes AA — voir docs/DESIGN.md §2.
 */
export function Alert({ children, role = "alert", className }: AlertProps) {
  return (
    <p
      role={role}
      aria-live={role === "alert" ? "assertive" : "polite"}
      className={cn(
        "rounded-lg border border-status-todo-fg/30 bg-status-todo-bg/50 px-3.5 py-2.5 text-sm font-medium text-status-todo-fg",
        className,
      )}
    >
      {children}
    </p>
  );
}
