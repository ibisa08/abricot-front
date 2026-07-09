"use client";

import { useEffect, useState } from "react";
import { Plus, FolderKanban, RotateCw } from "lucide-react";
import { toast } from "sonner";
import { useProjects } from "@/lib/queries";
import { Button } from "@/components/ui/Button";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { ProjectFormModal } from "@/components/projects/ProjectFormModal";

export function ProjectsClient() {
  const { data: projects, isLoading, isError, refetch, isFetching } = useProjects();
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    if (isError) toast.error("Impossible de charger vos projets. Réessayez.");
  }, [isError]);

  return (
    <div>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-text sm:text-3xl">Mes projets</h1>
          <p className="mt-1 text-text-muted">Gérez vos projets</p>
        </div>
        <Button variant="ink" onClick={() => setCreateOpen(true)} className="shrink-0">
          <Plus className="h-4 w-4" aria-hidden="true" />
          Créer un projet
        </Button>
      </header>

      <div className="mt-8">
        {isLoading ? (
          <ProjectsGridSkeleton />
        ) : isError ? (
          <EmptyState
            icon={<RotateCw className="h-6 w-6 text-text-muted" aria-hidden="true" />}
            title="Chargement impossible"
            description="Une erreur est survenue lors de la récupération de vos projets."
          >
            <Button variant="ink" size="sm" onClick={() => refetch()} disabled={isFetching}>
              {isFetching ? "Chargement…" : "Réessayer"}
            </Button>
          </EmptyState>
        ) : !projects || projects.length === 0 ? (
          <EmptyState
            icon={<FolderKanban className="h-6 w-6 text-text-muted" aria-hidden="true" />}
            title="Aucun projet"
            description="Créez votre premier projet pour commencer à organiser vos tâches."
          >
            <Button variant="ink" size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Créer un projet
            </Button>
          </EmptyState>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>

      <ProjectFormModal mode="create" open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* États                                                              */
/* ------------------------------------------------------------------ */

function EmptyState({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-10 text-center shadow-card">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-bg">
        {icon}
      </div>
      <h2 className="mt-4 font-heading text-lg font-semibold text-text">{title}</h2>
      <p className="mx-auto mt-1 max-w-sm text-sm text-text-muted">{description}</p>
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}

function ProjectsGridSkeleton() {
  return (
    <div
      className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">Chargement des projets…</span>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="rounded-2xl border border-border bg-surface p-6 shadow-card">
          <div className="h-5 w-2/3 animate-pulse rounded bg-border" />
          <div className="mt-3 h-4 w-full animate-pulse rounded bg-border" />
          <div className="mt-6 h-1.5 w-full animate-pulse rounded-full bg-border" />
          <div className="mt-6 h-6 w-1/2 animate-pulse rounded bg-border" />
        </div>
      ))}
    </div>
  );
}
