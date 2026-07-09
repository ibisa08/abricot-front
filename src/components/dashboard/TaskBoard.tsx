"use client";

import { useMemo } from "react";
import { isSameMonth, parseISO } from "date-fns";
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
 * aucune n'a d'échéance ce mois-ci (sinon le tableau serait vide).
 */
export function TaskBoard({ tasks }: TaskBoardProps) {
  const grouped = useMemo(() => {
    const now = new Date();
    const inMonth = tasks.filter((t) => t.dueDate && isSameMonth(parseISO(t.dueDate), now));
    const scoped = inMonth.length > 0 ? inMonth : tasks;

    return {
      TODO: scoped.filter((t) => t.status === "TODO"),
      IN_PROGRESS: scoped.filter((t) => t.status === "IN_PROGRESS"),
      DONE: scoped.filter((t) => t.status === "DONE"),
    } satisfies Record<string, Task[]>;
  }, [tasks]);

  return (
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
              <h2 className="font-heading text-base font-semibold text-text">{title}</h2>
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
  );
}
