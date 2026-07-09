"use client";

import { useId, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { TaskCard } from "@/components/tasks/TaskCard";
import type { Task } from "@/types";

export interface TaskListProps {
  tasks: Task[];
}

/**
 * Vue Liste : carte blanche « Mes tâches assignées » avec recherche client
 * (titre + description) et liste de <TaskCard> (ordre de priorité du back).
 */
export function TaskList({ tasks }: TaskListProps) {
  const searchId = useId();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tasks;
    return tasks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        (t.description ?? "").toLowerCase().includes(q),
    );
  }, [tasks, query]);

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-heading text-lg font-semibold text-text">Mes tâches assignées</h2>
          <p className="mt-0.5 text-sm text-text-muted">Par ordre de priorité</p>
        </div>

        <div className="w-full sm:max-w-xs">
          <Label htmlFor={searchId} className="sr-only">
            Rechercher une tâche
          </Label>
          <div className="relative">
            <Input
              id={searchId}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher une tâche"
              className="pr-10"
            />
            <Search
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
              aria-hidden="true"
            />
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {filtered.length > 0 ? (
          filtered.map((task) => <TaskCard key={task.id} task={task} variant="list" />)
        ) : (
          <p className="py-8 text-center text-sm text-text-muted">
            Aucune tâche ne correspond à votre recherche.
          </p>
        )}
      </div>
    </div>
  );
}
