"use client";

import { useState } from "react";
import { Trash2, Pencil, LoaderCircle } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import type { Status } from "@/types";

/**
 * Tâche proposée par l'IA, avant validation. Volontairement découplée du back :
 * c'est le contrat que la génération (Étape 6) devra produire.
 */
export interface ProposedTask {
  title: string;
  description: string;
  dueDate?: string | null;
  status?: Status;
}

export interface ProposedTaskReviewProps {
  tasks: ProposedTask[];
  /** Édition/suppression locales avant commit. */
  onChange: (tasks: ProposedTask[]) => void;
  /** Création effective des tâches (POST /projects/:id/tasks …). */
  onCommit: () => void;
  committing: boolean;
}

/**
 * Écran de revue des tâches proposées (« Vos tâches… ») : cartes éditables,
 * suppression locale, puis « + Ajouter les tâches » pour tout créer.
 * Purement piloté par ses props → réutilisable et testable avec des tâches mockées.
 */
export function ProposedTaskReview({
  tasks,
  onChange,
  onCommit,
  committing,
}: ProposedTaskReviewProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<{ title: string; description: string }>({
    title: "",
    description: "",
  });

  function startEdit(index: number) {
    setEditingIndex(index);
    setDraft({ title: tasks[index].title, description: tasks[index].description });
  }

  function saveEdit(index: number) {
    if (draft.title.trim().length < 2) return;
    const next = tasks.map((t, i) =>
      i === index ? { ...t, title: draft.title.trim(), description: draft.description.trim() } : t,
    );
    onChange(next);
    setEditingIndex(null);
  }

  function remove(index: number) {
    onChange(tasks.filter((_, i) => i !== index));
    if (editingIndex === index) setEditingIndex(null);
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-4">
        {tasks.map((task, index) => {
          const isEditing = editingIndex === index;
          return (
            <li key={index} className="rounded-xl border border-border bg-surface p-5 shadow-card">
              {isEditing ? (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor={`ai-title-${index}`}>Nom</Label>
                    <Input
                      id={`ai-title-${index}`}
                      value={draft.title}
                      onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`ai-desc-${index}`}>Description</Label>
                    <Textarea
                      id={`ai-desc-${index}`}
                      value={draft.description}
                      onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                      className="min-h-16"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ink"
                      onClick={() => saveEdit(index)}
                      disabled={draft.title.trim().length < 2}
                    >
                      Enregistrer
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingIndex(null)}>
                      Annuler
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <h3 className="font-heading text-base font-semibold text-text">{task.title}</h3>
                  {task.description && (
                    <p className="mt-1 text-sm text-text-muted">{task.description}</p>
                  )}
                  <div className="mt-4 flex items-center gap-3 text-xs">
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="inline-flex items-center gap-1.5 font-medium text-text-muted hover:text-status-todo-fg"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      Supprimer
                    </button>
                    <span aria-hidden="true" className="text-border">
                      |
                    </span>
                    <button
                      type="button"
                      onClick={() => startEdit(index)}
                      className="inline-flex items-center gap-1.5 font-medium text-text-muted hover:text-text"
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                      Modifier
                    </button>
                  </div>
                </>
              )}
            </li>
          );
        })}
      </ul>

      <div className="flex justify-center pt-2">
        <Button
          type="button"
          variant="ink"
          onClick={onCommit}
          disabled={committing || tasks.length === 0}
          className="min-w-52"
        >
          {committing ? (
            <>
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
              Ajout en cours…
            </>
          ) : (
            "+ Ajouter les tâches"
          )}
        </Button>
      </div>
    </div>
  );
}
