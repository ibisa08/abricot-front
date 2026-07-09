"use client";

import { useEffect, useState, type ReactNode } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { Plus, SquareCheck, Calendar, Inbox, RotateCw } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAssignedTasks, useCurrentUser } from "@/lib/queries";
import { Button } from "@/components/ui/Button";
import { ProjectFormModal } from "@/components/projects/ProjectFormModal";
import { TaskList } from "./TaskList";
import { TaskBoard } from "./TaskBoard";

/** Onglets de bascule de vue (style DESIGN.md : actif = fond orange clair). */
const TAB_TRIGGER_CLASS = cn(
  "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
  "text-text hover:bg-black/5",
  "data-[state=active]:bg-primary-soft data-[state=active]:text-primary data-[state=active]:hover:bg-primary-soft",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
);

export type DashboardView = "liste" | "kanban";

export interface DashboardClientProps {
  /** Vue affichée par défaut (déduite de `?view=` côté serveur → deep-link). */
  initialView?: DashboardView;
}

export function DashboardClient({ initialView = "liste" }: DashboardClientProps) {
  const { data: user } = useCurrentUser();
  const { data: tasks, isLoading, isError, refetch, isFetching } = useAssignedTasks();
  const [createOpen, setCreateOpen] = useState(false);

  // Erreur de chargement → toast (une fois par passage en erreur).
  useEffect(() => {
    if (isError) {
      toast.error("Impossible de charger vos tâches. Réessayez.");
    }
  }, [isError]);

  const greetingName = user?.name?.trim() || user?.email || "";

  /**
   * États partagés par les deux vues : squelette / erreur / vide.
   * Renvoie `null` quand les données sont prêtes (on affiche alors la vue).
   */
  function renderState(variant: "list" | "board"): ReactNode {
    if (isLoading) return <LoadingState variant={variant} />;

    if (isError) {
      return (
        <EmptyState
          icon={<RotateCw className="h-6 w-6 text-text-muted" aria-hidden="true" />}
          title="Chargement impossible"
          description="Une erreur est survenue lors de la récupération de vos tâches."
        >
          <Button variant="ink" size="sm" onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? "Chargement…" : "Réessayer"}
          </Button>
        </EmptyState>
      );
    }

    if (!tasks || tasks.length === 0) {
      return (
        <EmptyState
          icon={<Inbox className="h-6 w-6 text-text-muted" aria-hidden="true" />}
          title="Aucune tâche assignée"
          description="Les tâches qui vous seront assignées apparaîtront ici."
        />
      );
    }

    return null;
  }

  return (
    <div>
      {/* En-tête */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-text sm:text-3xl">
            Tableau de bord
          </h1>
          <p className="mt-1 text-text-muted">
            Bonjour{greetingName ? ` ${greetingName}` : ""}, voici un aperçu de vos projets et
            tâches
          </p>
        </div>
        <Button variant="ink" onClick={() => setCreateOpen(true)} className="shrink-0">
          <Plus className="h-4 w-4" aria-hidden="true" />
          Créer un projet
        </Button>
      </header>

      <ProjectFormModal mode="create" open={createOpen} onOpenChange={setCreateOpen} />


      {/* Bascule de vues + contenus */}
      <Tabs.Root defaultValue={initialView} className="mt-8">
        <Tabs.List
          aria-label="Basculer entre la vue Liste et la vue Kanban"
          className="flex items-center gap-3"
        >
          <Tabs.Trigger value="liste" className={TAB_TRIGGER_CLASS}>
            <SquareCheck className="h-4 w-4 text-primary" aria-hidden="true" />
            Liste
          </Tabs.Trigger>
          <Tabs.Trigger value="kanban" className={TAB_TRIGGER_CLASS}>
            <Calendar className="h-4 w-4 text-primary" aria-hidden="true" />
            Kanban
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="liste" className="mt-6 focus-visible:outline-none">
          {renderState("list") ?? <TaskList tasks={tasks!} />}
        </Tabs.Content>

        <Tabs.Content value="kanban" className="mt-6 focus-visible:outline-none">
          {renderState("board") ?? <TaskBoard tasks={tasks!} />}
        </Tabs.Content>
      </Tabs.Root>
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
  icon: ReactNode;
  title: string;
  description: string;
  children?: ReactNode;
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

function LoadingState({ variant }: { variant: "list" | "board" }) {
  const cardSkeleton = (
    <div className="rounded-xl border border-border bg-surface p-6 shadow-card">
      <div className="h-5 w-2/5 animate-pulse rounded bg-border" />
      <div className="mt-3 h-4 w-3/5 animate-pulse rounded bg-border" />
      <div className="mt-5 h-3 w-1/2 animate-pulse rounded bg-border" />
    </div>
  );

  if (variant === "board") {
    return (
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3" aria-busy="true" aria-live="polite">
        <span className="sr-only">Chargement des tâches…</span>
        {[0, 1, 2].map((col) => (
          <div key={col} className="space-y-4">
            {cardSkeleton}
            {cardSkeleton}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className="space-y-4 rounded-2xl border border-border bg-surface p-6 shadow-card"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">Chargement des tâches…</span>
      <div className="h-6 w-48 animate-pulse rounded bg-border" />
      {[0, 1, 2, 3].map((i) => (
        <div key={i}>{cardSkeleton}</div>
      ))}
    </div>
  );
}
