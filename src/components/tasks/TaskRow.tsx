"use client";

import { useState } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MoreHorizontal, Pencil, Trash2, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { api, ApiError, toUserMessage } from "@/lib/api";
import { queryKeys } from "@/lib/queries";
import { formatDueDate } from "@/lib/format";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Avatar } from "@/components/ui/Avatar";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { TaskFormModal } from "@/components/tasks/TaskFormModal";
import { TaskComments } from "@/components/tasks/TaskComments";
import type { SelectedUser } from "@/components/ui/UserMultiSelect";
import type { Task, User } from "@/types";

export interface TaskRowProps {
  task: Task;
  projectId: string;
  /** Candidats assignables (propriétaire + membres) pour l'édition. */
  teamOptions: SelectedUser[];
  currentUser?: User;
}

/**
 * Ligne de tâche (vue Liste) : titre + statut, description, échéance, assignés,
 * menu « … » (Modifier / Supprimer) et section repliable « Commentaires (n) ».
 * La gestion des tâches est ouverte à tous les membres du projet.
 */
export function TaskRow({ task, projectId, teamOptions, currentUser }: TaskRowProps) {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const due = formatDueDate(task.dueDate);
  const commentsId = `comments-${task.id}`;

  const deleteMutation = useMutation({
    mutationFn: () => api.del(`/projects/${projectId}/tasks/${task.id}`),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.projectTasks(projectId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.project(projectId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.assignedTasks }),
      ]);
      toast.success("Tâche supprimée.");
      setDeleteOpen(false);
    },
    onError: (err) =>
      toast.error(err instanceof ApiError ? toUserMessage(err) : "La suppression a échoué."),
  });

  return (
    <article className="rounded-xl border border-border bg-surface">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-heading text-base font-semibold text-text">{task.title}</h3>
              <StatusBadge status={task.status} />
            </div>
            {task.description && (
              <p className="mt-1 text-sm text-text-muted">{task.description}</p>
            )}

            <p className="mt-3 flex items-center gap-1.5 text-xs text-text-muted">
              Échéance :
              <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
              {due ?? "—"}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-text-muted">
              <span>Assigné à :</span>
              {task.assignees.length > 0 ? (
                task.assignees.map((a) => (
                  <span
                    key={a.id}
                    className="inline-flex items-center gap-1.5 rounded-full bg-bg py-0.5 pl-0.5 pr-2"
                  >
                    <Avatar name={a.user.name ?? a.user.email} size="sm" className="h-5 w-5 text-[9px]" />
                    <span className="text-text">{a.user.name ?? a.user.email}</span>
                  </span>
                ))
              ) : (
                <span className="italic">Personne</span>
              )}
            </div>
          </div>

          {/* Menu … (tous les membres peuvent gérer les tâches) */}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger
              aria-label={`Actions pour la tâche ${task.title}`}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-text-muted transition-colors hover:bg-black/5 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                align="end"
                sideOffset={6}
                className="z-50 min-w-40 rounded-xl border border-border bg-surface p-1 shadow-card"
              >
                <DropdownMenu.Item
                  onSelect={() => setEditOpen(true)}
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-text outline-none data-[highlighted]:bg-black/5"
                >
                  <Pencil className="h-4 w-4 text-text-muted" aria-hidden="true" />
                  Modifier
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  onSelect={() => setDeleteOpen(true)}
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-status-todo-fg outline-none data-[highlighted]:bg-status-todo-bg/50"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  Supprimer
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </div>

      {/* Commentaires (repliable) */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        aria-controls={commentsId}
        className="flex w-full items-center justify-between gap-2 border-t border-border px-5 py-3 text-sm font-medium text-text transition-colors hover:bg-black/5"
      >
        Commentaires ({task.comments.length})
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-text-muted" aria-hidden="true" />
        ) : (
          <ChevronDown className="h-4 w-4 text-text-muted" aria-hidden="true" />
        )}
      </button>
      {expanded && (
        <div id={commentsId} className="border-t border-border p-5">
          <TaskComments
            projectId={projectId}
            taskId={task.id}
            comments={task.comments}
            currentUserId={currentUser?.id}
            currentUserName={currentUser?.name}
          />
        </div>
      )}

      {/* Modales */}
      <TaskFormModal
        mode="edit"
        projectId={projectId}
        teamOptions={teamOptions}
        open={editOpen}
        onOpenChange={setEditOpen}
        task={task}
      />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Supprimer la tâche"
        description={`La tâche « ${task.title} » sera définitivement supprimée.`}
        confirmLabel="Supprimer"
        destructive
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
      />
    </article>
  );
}
