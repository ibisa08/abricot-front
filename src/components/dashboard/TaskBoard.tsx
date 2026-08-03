"use client";

import { useMemo, useState } from "react";
import { format, isSameMonth, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { TaskCard } from "@/components/tasks/TaskCard";
import type { Status, Task } from "@/types";

export interface TaskBoardProps {
  tasks: Task[];
}

/** Colonnes du Kanban (CANCELLED est volontairement exclu). */
const COLUMNS: { status: Extract<Status, "TODO" | "IN_PROGRESS" | "DONE">; title: string }[] = [
  { status: "TODO", title: "À faire" },
  { status: "IN_PROGRESS", title: "En cours" },
  { status: "DONE", title: "Terminées" },
];

/**
 * Vue Kanban : 3 colonnes par statut avec compteur.
 *
 * Spec « tâches du mois » : on privilégie les tâches dont l'échéance tombe dans
 * le mois courant, mais on retombe sur l'ensemble des tâches assignées quand
 * aucune n'a d'échéance ce mois-ci (sinon le tableau serait vide). Le mode
 * retenu est affiché explicitement en tête du tableau : sans cet intitulé,
 * l'utilisateur ne peut pas distinguer un tableau filtré d'un tableau complet.
 */
export function TaskBoard({ tasks }: TaskBoardProps) {
  /**
   * Date de référence figée au montage. Elle était auparavant recalculée à
   * chaque changement de `tasks` sans figurer dans les dépendances du useMemo :
   * un passage de minuit ou de fin de mois pouvait reclasser le tableau (voire
   * le faire basculer de mode) au milieu d'une interaction.
   */
  const [referenceDate] = useState(() => new Date());

  const { grouped, isMonthScoped } = useMemo(() => {
    const inMonth = tasks.filter(
      (t) => t.dueDate && isSameMonth(parseISO(t.dueDate), referenceDate),
    );
    const monthScoped = inMonth.length > 0;
    const scoped = monthScoped ? inMonth : tasks;

    return {
      isMonthScoped: monthScoped,
      grouped: {
        TODO: scoped.filter((t) => t.status === "TODO"),
        IN_PROGRESS: scoped.filter((t) => t.status === "IN_PROGRESS"),
        DONE: scoped.filter((t) => t.status === "DONE"),
      } satisfies Record<string, Task[]>,
    };
  }, [tasks, referenceDate]);

  // « août 2026 » — la forme « du mois : <mois> » évite l'élision (d'août/de mars).
  const monthLabel = format(referenceDate, "MMMM yyyy", { locale: fr });

  return (
    <div>
      {/* h1 « Tableau de bord » → h2 (mode) → h3 (colonnes) → h4 (tâches). */}
      <header className="mb-5">
        <h2 className="font-heading text-lg font-semibold text-text">
          {isMonthScoped ? `Tâches du mois : ${monthLabel}` : "Toutes vos tâches"}
        </h2>
        {!isMonthScoped && (
          <p className="mt-0.5 text-sm text-text-muted">
            Aucune tâche n’arrive à échéance en {monthLabel} : l’ensemble de vos tâches assignées
            est affiché.
          </p>
        )}
      </header>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {COLUMNS.map(({ status, title }) => {
          const columnTasks = grouped[status];
          return (
            <section
              key={status}
              aria-label={`${title} (${columnTasks.length})`}
              className="rounded-2xl border border-border bg-surface/60 p-4"
            >
              <header className="mb-4 flex items-center gap-2 px-1">
                <h3 className="font-heading text-base font-semibold text-text">{title}</h3>
                <span
                  className="inline-flex min-w-6 items-center justify-center rounded-full bg-status-cancel-bg px-2 py-0.5 text-xs font-medium text-text-muted"
                  aria-hidden="true"
                >
                  {columnTasks.length}
                </span>
              </header>

              <div className="space-y-4">
                {columnTasks.length > 0 ? (
                  columnTasks.map((task) => <TaskCard key={task.id} task={task} variant="board" />)
                ) : (
                  <p className="rounded-xl border border-dashed border-border px-3 py-6 text-center text-sm text-text-muted">
                    Aucune tâche
                  </p>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
