"use client";

import { useMemo } from "react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { TaskRow } from "@/components/tasks/TaskRow";
import type { SelectedUser } from "@/components/ui/UserMultiSelect";
import type { Task, User } from "@/types";

export interface TaskCalendarProps {
  tasks: Task[];
  projectId: string;
  teamOptions: SelectedUser[];
  currentUser?: User;
}

const NO_DATE = "none";

/**
 * Vue Calendrier « simple » : tâches regroupées par jour d'échéance
 * (une liste par jour, triée). Les tâches sans échéance sont regroupées à la fin.
 */
export function TaskCalendar({ tasks, projectId, teamOptions, currentUser }: TaskCalendarProps) {
  const groups = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const task of tasks) {
      const key = task.dueDate ? task.dueDate.slice(0, 10) : NO_DATE;
      const bucket = map.get(key);
      if (bucket) bucket.push(task);
      else map.set(key, [task]);
    }
    return [...map.entries()].sort(([a], [b]) => {
      if (a === NO_DATE) return 1;
      if (b === NO_DATE) return -1;
      return a < b ? -1 : a > b ? 1 : 0;
    });
  }, [tasks]);

  function heading(key: string): string {
    if (key === NO_DATE) return "Sans échéance";
    const label = format(parseISO(key), "EEEE d MMMM yyyy", { locale: fr });
    return label.charAt(0).toUpperCase() + label.slice(1);
  }

  return (
    <div className="space-y-8">
      {groups.map(([key, dayTasks]) => (
        <section key={key} aria-label={heading(key)}>
          <h3 className="mb-3 font-heading text-sm font-semibold text-text">
            {heading(key)}
            <span className="ml-2 font-normal text-text-muted">({dayTasks.length})</span>
          </h3>
          <div className="space-y-4">
            {dayTasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                projectId={projectId}
                teamOptions={teamOptions}
                currentUser={currentUser}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
