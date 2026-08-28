"use client";

import { GripVertical } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { TaskCard } from "@/components/tasks/TaskCard";
import type { Task } from "@/types";

export interface BoardTaskCardProps {
  task: Task;
}

/** Poignée, hors contexte de glisser-déposer — sert aussi à l'aperçu. */
function GripHandleShape({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "mt-3.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-text-muted",
        className,
      )}
    >
      <GripVertical className="h-4 w-4" aria-hidden="true" />
    </span>
  );
}

/**
 * Aperçu rendu dans le `<DragOverlay>` pendant le déplacement.
 *
 * Reproduit la mise en page de `BoardTaskCard` (poignée + carte) pour que
 * l'élément qui suit le curseur ait exactement la largeur de celui qu'il
 * remplace — un aperçu réduit à la seule carte serait décalé de la largeur de
 * la poignée.
 */
export function BoardTaskCardPreview({ task }: BoardTaskCardProps) {
  return (
    <div className="flex items-start gap-2">
      <GripHandleShape />
      <TaskCard task={task} variant="board" className="min-w-0 flex-1 shadow-md" />
    </div>
  );
}

/**
 * Enveloppe Kanban d'une `<TaskCard>`.
 *
 * Le `useSortable` vit ici, jamais dans `TaskCard` : celle-ci est partagée avec
 * la vue Liste, qui n'a aucun contexte de glisser-déposer et lèverait à
 * l'exécution.
 *
 * Le déplacement s'amorce depuis une poignée dédiée et non depuis la carte
 * entière : la carte contient le lien « Voir », et la rendre déplaçable
 * imbriquerait deux éléments interactifs — inutilisable au clavier.
 */
export function BoardTaskCard({ task }: BoardTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    // `aria-roledescription` par défaut : « sortable », en anglais.
    attributes: { roleDescription: "tâche déplaçable" },
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn("flex items-start gap-2", isDragging && "opacity-40")}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        aria-label={`Déplacer la tâche « ${task.title} »`}
        {...attributes}
        {...listeners}
        className={cn(
          "mt-3.5 flex h-9 w-9 shrink-0 cursor-grab items-center justify-center rounded-lg",
          "border border-border bg-surface text-text-muted transition-colors",
          "hover:bg-black/5 hover:text-text active:cursor-grabbing",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        )}
      >
        <GripVertical className="h-4 w-4" aria-hidden="true" />
      </button>

      <TaskCard task={task} variant="board" className="min-w-0 flex-1" />
    </div>
  );
}
