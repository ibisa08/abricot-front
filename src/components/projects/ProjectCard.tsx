"use client";

import { useState } from "react";
import Link from "next/link";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Users, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { api, ApiError, toUserMessage } from "@/lib/api";
import { useCurrentUser, useProjectTasks, queryKeys } from "@/lib/queries";
import { Avatar, AvatarGroup } from "@/components/ui/Avatar";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ProjectFormModal } from "@/components/projects/ProjectFormModal";
import type { Project, UserRef } from "@/types";

export interface ProjectCardProps {
  project: Project;
}

/**
 * Carte projet (docs/DESIGN.md §4) : titre, description, barre de progression,
 * « X/Y tâches terminées », équipe (owner + membres) et badge « Propriétaire ».
 * Toute la carte est un lien vers `/projets/:id` (pattern stretched-link, pour
 * cohabiter avec le menu d'actions).
 */
export function ProjectCard({ project }: ProjectCardProps) {
  const queryClient = useQueryClient();
  const { data: currentUser } = useCurrentUser();
  const { data: tasks } = useProjectTasks(project.id);

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const total = project._count.tasks;
  const done = tasks ? tasks.filter((t) => t.status === "DONE").length : 0;
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;

  // Équipe = propriétaire + membres (le back n'inclut pas l'owner dans members ;
  // on filtre par sécurité pour éviter tout doublon).
  const otherMembers = project.members
    .map((m) => m.user)
    .filter((u) => u.id !== project.ownerId);
  const team: UserRef[] = [project.owner, ...otherMembers];

  const isOwner = currentUser?.id === project.ownerId;
  const isAdmin = project.userRole === "ADMIN";
  const hasActions = isAdmin || isOwner;

  const deleteMutation = useMutation({
    mutationFn: () => api.del(`/projects/${project.id}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.projects });
      toast.success("Projet supprimé.");
      setDeleteOpen(false);
    },
    onError: (err) => {
      const message =
        err instanceof ApiError ? toUserMessage(err) : "La suppression a échoué. Réessayez.";
      toast.error(message);
    },
  });

  return (
    <article className="group relative flex flex-col rounded-2xl border border-border bg-surface p-6 shadow-card transition-shadow hover:shadow-md focus-within:ring-2 focus-within:ring-primary">
      {/* Lien étendu : couvre toute la carte, en dessous du contenu. */}
      <Link
        href={`/projets/${project.id}`}
        aria-label={`Ouvrir le projet ${project.name}`}
        className="absolute inset-0 z-0 rounded-2xl"
      />

      {/* Menu d'actions (au-dessus du lien) */}
      {hasActions && (
        <div className="absolute right-4 top-4 z-20">
          <ProjectActionsMenu
            canEdit={isAdmin}
            canDelete={isOwner}
            projectName={project.name}
            onEdit={() => setEditOpen(true)}
            onDelete={() => setDeleteOpen(true)}
          />
        </div>
      )}

      {/* Contenu (clics traversent vers le lien) */}
      <div className="pointer-events-none relative z-10 flex flex-1 flex-col">
        <h2 className={`font-heading text-lg font-semibold text-text ${hasActions ? "pr-8" : ""}`}>
          {project.name}
        </h2>
        {project.description && (
          <p className="mt-1 line-clamp-2 text-sm text-text-muted">{project.description}</p>
        )}

        {/* Progression */}
        <div className="mt-6">
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-muted">Progression</span>
            <span className="font-medium text-text">{percent}%</span>
          </div>
          <div
            className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border"
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Progression : ${percent}%`}
          >
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${percent}%` }} />
          </div>
          <p className="mt-2 text-xs text-text-muted">
            {done}/{total} tâche{total > 1 ? "s" : ""} terminée{done > 1 ? "s" : ""}
          </p>
        </div>

        {/* Équipe */}
        <div className="mt-6">
          <p className="flex items-center gap-1.5 text-xs text-text-muted">
            <Users className="h-3.5 w-3.5" aria-hidden="true" />
            Équipe ({team.length})
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Avatar name={project.owner.name ?? project.owner.email} size="sm" />
            {isOwner && (
              <span className="inline-flex items-center rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-medium text-primary">
                Propriétaire
              </span>
            )}
            {otherMembers.length > 0 && (
              <AvatarGroup names={otherMembers.map((u) => u.name ?? u.email)} size="sm" max={3} />
            )}
          </div>
        </div>
      </div>

      {/* Modales (rendues au niveau de la carte) */}
      {isAdmin && (
        <ProjectFormModal mode="edit" open={editOpen} onOpenChange={setEditOpen} project={project} />
      )}
      {isOwner && (
        <ConfirmDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          title="Supprimer le projet"
          description={`Le projet « ${project.name} » et ses tâches seront définitivement supprimés. Cette action est irréversible.`}
          confirmLabel="Supprimer"
          destructive
          loading={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutate()}
        />
      )}
    </article>
  );
}

/* ------------------------------------------------------------------ */
/* Menu d'actions (kebab) — n'affiche que les actions autorisées       */
/* ------------------------------------------------------------------ */

function ProjectActionsMenu({
  canEdit,
  canDelete,
  projectName,
  onEdit,
  onDelete,
}: {
  canEdit: boolean;
  canDelete: boolean;
  projectName: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        aria-label={`Actions pour ${projectName}`}
        className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-black/5 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <MoreVertical className="h-4 w-4" aria-hidden="true" />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className="z-50 min-w-40 rounded-xl border border-border bg-surface p-1 shadow-card"
        >
          {canEdit && (
            <DropdownMenu.Item
              onSelect={onEdit}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-text outline-none data-[highlighted]:bg-black/5"
            >
              <Pencil className="h-4 w-4 text-text-muted" aria-hidden="true" />
              Modifier
            </DropdownMenu.Item>
          )}
          {canDelete && (
            <DropdownMenu.Item
              onSelect={onDelete}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-status-todo-fg outline-none data-[highlighted]:bg-status-todo-bg/50"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Supprimer
            </DropdownMenu.Item>
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
