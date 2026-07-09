"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import * as Tabs from "@radix-ui/react-tabs";
import { ArrowLeft, Sparkles, SquareCheck, CalendarDays, Users, Search, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProject, useProjectTasks, useCurrentUser } from "@/lib/queries";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { ProjectFormModal } from "@/components/projects/ProjectFormModal";
import { TaskFormModal } from "@/components/tasks/TaskFormModal";
import { AiGenerateModal } from "@/components/tasks/AiGenerateModal";
import { TaskRow } from "@/components/tasks/TaskRow";
import { TaskCalendar } from "@/components/tasks/TaskCalendar";
import { StatusFilter, type StatusFilterValue } from "@/components/tasks/StatusFilter";
import type { SelectedUser } from "@/components/ui/UserMultiSelect";
import type { Task, User } from "@/types";

const TAB_TRIGGER_CLASS = cn(
  "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
  "text-text hover:bg-black/5",
  "data-[state=active]:bg-primary-soft data-[state=active]:text-primary data-[state=active]:hover:bg-primary-soft",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
);

export function ProjectDetailClient({ id }: { id: string }) {
  const { data: currentUser } = useCurrentUser();
  const { data: project, isLoading, isError, refetch } = useProject(id);
  const tasksQuery = useProjectTasks(id);

  const [editProjectOpen, setEditProjectOpen] = useState(false);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("ALL");
  const [search, setSearch] = useState("");
  const searchId = "task-search";

  // Candidats assignables = propriétaire + membres (dédupliqués).
  const teamOptions = useMemo<SelectedUser[]>(() => {
    if (!project) return [];
    const others = project.members.map((m) => m.user).filter((u) => u.id !== project.ownerId);
    return [project.owner, ...others];
  }, [project]);

  const filteredTasks = useMemo(() => {
    const list = tasksQuery.data ?? [];
    const q = search.trim().toLowerCase();
    return list.filter((t) => {
      if (statusFilter !== "ALL" && t.status !== statusFilter) return false;
      if (!q) return true;
      return t.title.toLowerCase().includes(q) || (t.description ?? "").toLowerCase().includes(q);
    });
  }, [tasksQuery.data, statusFilter, search]);

  if (isLoading) return <DetailSkeleton />;

  if (isError || !project) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-10 text-center shadow-card">
        <h1 className="font-heading text-lg font-semibold text-text">Projet introuvable</h1>
        <p className="mt-1 text-sm text-text-muted">
          Ce projet n’existe pas ou vous n’y avez pas accès.
        </p>
        <div className="mt-5 flex justify-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => refetch()}>
            Réessayer
          </Button>
          <Link
            href="/projets"
            className="inline-flex h-9 items-center rounded-lg bg-ink px-3 text-sm font-medium text-white hover:bg-ink-hover"
          >
            Retour aux projets
          </Link>
        </div>
      </div>
    );
  }

  const isAdmin = project.userRole === "ADMIN";
  const teamCount = teamOptions.length;

  return (
    <div>
      {/* En-tête */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Link
            href="/projets"
            aria-label="Retour aux projets"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-text transition-colors hover:bg-black/5"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </Link>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-heading text-2xl font-semibold text-text">{project.name}</h1>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setEditProjectOpen(true)}
                  className="rounded text-sm font-medium text-primary hover:text-primary-hover hover:underline"
                >
                  Modifier
                </button>
              )}
            </div>
            {project.description && (
              <p className="mt-1 text-text-muted">{project.description}</p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <Button variant="ink" onClick={() => setCreateTaskOpen(true)}>
            Créer une tâche
          </Button>
          <Button variant="accent" onClick={() => setAiOpen(true)}>
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            IA
          </Button>
        </div>
      </header>

      {/* Bandeau contributeurs */}
      <section
        aria-label="Contributeurs"
        className="mt-6 flex flex-col gap-3 rounded-2xl bg-surface/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <p className="flex items-center gap-2 text-sm">
          <Users className="h-4 w-4 text-text-muted" aria-hidden="true" />
          <span className="font-semibold text-text">Contributeurs</span>
          <span className="text-text-muted">{teamCount} personnes</span>
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-bg py-0.5 pl-0.5 pr-2">
            <Avatar
              name={project.owner.name ?? project.owner.email}
              size="sm"
              className="h-5 w-5 text-[9px]"
            />
            <span className="rounded-full bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary">
              Propriétaire
            </span>
          </span>
          {teamOptions
            .filter((u) => u.id !== project.ownerId)
            .map((u) => (
              <span
                key={u.id}
                className="inline-flex items-center gap-1.5 rounded-full bg-bg py-0.5 pl-0.5 pr-2 text-xs text-text"
              >
                <Avatar name={u.name ?? u.email} size="sm" className="h-5 w-5 text-[9px]" />
                {u.name ?? u.email}
              </span>
            ))}
        </div>
      </section>

      {/* Carte Tâches */}
      <div className="mt-6 rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-6">
        <Tabs.Root defaultValue="liste">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="font-heading text-lg font-semibold text-text">Tâches</h2>
              <p className="mt-0.5 text-sm text-text-muted">Par ordre de priorité</p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Tabs.List aria-label="Vue des tâches" className="flex items-center gap-2">
                <Tabs.Trigger value="liste" className={TAB_TRIGGER_CLASS}>
                  <SquareCheck className="h-4 w-4 text-primary" aria-hidden="true" />
                  Liste
                </Tabs.Trigger>
                <Tabs.Trigger value="calendrier" className={TAB_TRIGGER_CLASS}>
                  <CalendarDays className="h-4 w-4 text-primary" aria-hidden="true" />
                  Calendrier
                </Tabs.Trigger>
              </Tabs.List>

              <StatusFilter value={statusFilter} onValueChange={setStatusFilter} />

              <div className="relative">
                <Label htmlFor={searchId} className="sr-only">
                  Rechercher une tâche
                </Label>
                <Input
                  id={searchId}
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher une tâche"
                  className="pr-10 sm:w-56"
                />
                <Search
                  className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>

          <div className="mt-6">
            <TasksBody
              tasksQuery={tasksQuery}
              filteredTasks={filteredTasks}
              projectId={id}
              teamOptions={teamOptions}
              currentUser={currentUser}
            />
          </div>
        </Tabs.Root>
      </div>

      {/* Modales */}
      {isAdmin && (
        <ProjectFormModal
          mode="edit"
          open={editProjectOpen}
          onOpenChange={setEditProjectOpen}
          project={project}
        />
      )}
      <TaskFormModal
        mode="create"
        projectId={id}
        teamOptions={teamOptions}
        open={createTaskOpen}
        onOpenChange={setCreateTaskOpen}
      />
      <AiGenerateModal projectId={id} open={aiOpen} onOpenChange={setAiOpen} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Corps des tâches (états + Liste / Calendrier)                       */
/* ------------------------------------------------------------------ */

function TasksBody({
  tasksQuery,
  filteredTasks,
  projectId,
  teamOptions,
  currentUser,
}: {
  tasksQuery: ReturnType<typeof useProjectTasks>;
  filteredTasks: Task[];
  projectId: string;
  teamOptions: SelectedUser[];
  currentUser: User | undefined;
}) {
  if (tasksQuery.isLoading) {
    return (
      <div className="space-y-4" aria-busy="true" aria-live="polite">
        <span className="sr-only">Chargement des tâches…</span>
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-xl border border-border bg-surface p-5">
            <div className="h-5 w-2/5 animate-pulse rounded bg-border" />
            <div className="mt-3 h-4 w-3/5 animate-pulse rounded bg-border" />
            <div className="mt-4 h-3 w-1/3 animate-pulse rounded bg-border" />
          </div>
        ))}
      </div>
    );
  }

  if (tasksQuery.isError) {
    return (
      <div className="rounded-xl border border-border bg-surface p-8 text-center">
        <p className="text-sm text-text-muted">Impossible de charger les tâches.</p>
        <Button variant="ink" size="sm" className="mt-3" onClick={() => tasksQuery.refetch()}>
          Réessayer
        </Button>
      </div>
    );
  }

  const total = tasksQuery.data?.length ?? 0;
  if (total === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-10 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-bg">
          <Inbox className="h-6 w-6 text-text-muted" aria-hidden="true" />
        </div>
        <p className="mt-3 text-sm text-text-muted">
          Aucune tâche pour ce projet. Créez-en une pour commencer.
        </p>
      </div>
    );
  }

  if (filteredTasks.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-text-muted">
        Aucune tâche ne correspond à votre recherche ou à ce filtre.
      </p>
    );
  }

  return (
    <>
      <Tabs.Content value="liste" className="space-y-4 focus-visible:outline-none">
        {filteredTasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            projectId={projectId}
            teamOptions={teamOptions}
            currentUser={currentUser}
          />
        ))}
      </Tabs.Content>
      <Tabs.Content value="calendrier" className="focus-visible:outline-none">
        <TaskCalendar
          tasks={filteredTasks}
          projectId={projectId}
          teamOptions={teamOptions}
          currentUser={currentUser}
        />
      </Tabs.Content>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Skeleton                                                           */
/* ------------------------------------------------------------------ */

function DetailSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">Chargement du projet…</span>
      <div className="flex items-start gap-4">
        <div className="h-11 w-11 animate-pulse rounded-lg bg-border" />
        <div className="flex-1">
          <div className="h-7 w-64 animate-pulse rounded bg-border" />
          <div className="mt-2 h-4 w-96 max-w-full animate-pulse rounded bg-border" />
        </div>
      </div>
      <div className="mt-6 h-16 animate-pulse rounded-2xl bg-border/60" />
      <div className="mt-6 h-64 animate-pulse rounded-2xl bg-border/60" />
    </div>
  );
}
