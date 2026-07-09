"use client";

import { useEffect, useId, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Sparkles, Plus, LoaderCircle, WandSparkles, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queries";
import { Modal } from "@/components/ui/Modal";
import { ProposedTaskReview, type ProposedTask } from "@/components/tasks/ProposedTaskReview";
import type { Task } from "@/types";

export interface AiGenerateModalProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Phase = "input" | "review";
type InputState = "idle" | "loading" | "unavailable" | "error";

/** Exemple injecté en dev pour tester la revue + le commit sans LLM. */
const DEV_SAMPLE_TASKS: ProposedTask[] = [
  {
    title: "Configurer l'authentification JWT",
    description: "Émission et vérification des tokens, refresh et middleware d'autorisation.",
    status: "TODO",
  },
  {
    title: "Créer les endpoints produits",
    description: "CRUD des produits avec pagination, tri et filtres.",
    status: "IN_PROGRESS",
  },
  {
    title: "Écrire les tests d'intégration",
    description: "Couvrir les parcours critiques : authentification, panier et commande.",
    status: "TODO",
  },
];

const IS_DEV = process.env.NODE_ENV !== "production";

/**
 * Modale de génération de tâches par IA (UI complète, seam prêt pour l'Étape 6).
 * Phase « input » : prompt → POST /api/ai/generate-tasks. Tant que la route
 * renvoie AI_NOT_IMPLEMENTED (501), on affiche un état « bientôt disponible »
 * sans casser l'app. Phase « review » : revue/édition des tâches proposées puis
 * commit réel via POST /projects/:id/tasks.
 */
export function AiGenerateModal({ projectId, open, onOpenChange }: AiGenerateModalProps) {
  const queryClient = useQueryClient();
  const promptId = useId();

  const [phase, setPhase] = useState<Phase>("input");
  const [state, setState] = useState<InputState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [prompt, setPrompt] = useState("");
  const [proposed, setProposed] = useState<ProposedTask[]>([]);
  const [committing, setCommitting] = useState(false);

  // Réinitialise tout à l'ouverture.
  useEffect(() => {
    if (open) {
      setPhase("input");
      setState("idle");
      setErrorMessage("");
      setPrompt("");
      setProposed([]);
      setCommitting(false);
    }
  }, [open]);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (prompt.trim() === "" || state === "loading") return;

    setState("loading");
    setErrorMessage("");
    try {
      const res = await fetch("/api/ai/generate-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, prompt }),
      });
      const json = (await res.json().catch(() => null)) as
        | { success?: boolean; code?: string; message?: string; data?: { tasks?: ProposedTask[] } }
        | null;

      if (res.ok && json?.success && Array.isArray(json.data?.tasks)) {
        // Chemin nominal (Étape 6) : on passe à la revue.
        setProposed(json.data.tasks);
        setPhase("review");
        setState("idle");
      } else if (res.status === 501 || json?.code === "AI_NOT_IMPLEMENTED") {
        setState("unavailable");
      } else {
        setState("error");
        setErrorMessage(json?.message ?? "Le service IA est momentanément indisponible.");
      }
    } catch {
      setState("error");
      setErrorMessage("Impossible de contacter le service IA. Vérifiez votre connexion.");
    }
  }

  async function handleCommit() {
    if (proposed.length === 0) return;
    setCommitting(true);

    const results = await Promise.allSettled(
      proposed.map(async (t) => {
        const body: Record<string, unknown> = {
          title: t.title,
          description: t.description,
          assigneeIds: [],
        };
        if (t.dueDate) {
          body.dueDate = t.dueDate.length === 10 ? `${t.dueDate}T00:00:00.000Z` : t.dueDate;
        }
        const { task } = await api.post<{ task: Task }>(`/projects/${projectId}/tasks`, body);
        // POST ignore `status` → PUT si un autre statut est proposé.
        if (t.status && t.status !== "TODO") {
          await api.put(`/projects/${projectId}/tasks/${task.id}`, { status: t.status });
        }
      }),
    );

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.projectTasks(projectId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.project(projectId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.assignedTasks }),
    ]);

    const failedTasks = proposed.filter((_, i) => results[i].status === "rejected");
    const added = proposed.length - failedTasks.length;
    setCommitting(false);

    if (failedTasks.length === 0) {
      toast.success(`${added} tâche${added > 1 ? "s" : ""} ajoutée${added > 1 ? "s" : ""}.`);
      onOpenChange(false);
    } else {
      // On garde les tâches en échec pour un nouvel essai.
      setProposed(failedTasks);
      toast.warning(`${added} ajoutée(s), ${failedTasks.length} en échec. Réessayez.`);
    }
  }

  const title = (
    <span className="inline-flex items-center gap-2">
      <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
      {phase === "review" ? "Vos tâches…" : "Créer une tâche"}
    </span>
  );

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={title} className="max-w-xl">
      <div className="flex max-h-[70vh] min-h-[440px] flex-col">
        <div className="flex-1 overflow-y-auto">
          {phase === "review" ? (
            <ProposedTaskReview
              tasks={proposed}
              onChange={setProposed}
              onCommit={handleCommit}
              committing={committing}
            />
          ) : (
            <InputPhaseBody
              state={state}
              errorMessage={errorMessage}
              onLoadSample={IS_DEV ? () => {
                setProposed(DEV_SAMPLE_TASKS);
                setPhase("review");
              } : undefined}
            />
          )}
        </div>

        {/* Barre de prompt (persiste dans les deux phases) */}
        <form
          onSubmit={handleGenerate}
          className={cn(
            "mt-4 flex shrink-0 items-center gap-2 rounded-2xl border border-border px-3 py-2",
            phase === "review" && "bg-bg",
          )}
        >
          <label htmlFor={promptId} className="sr-only">
            Décrire les tâches à générer
          </label>
          <input
            id={promptId}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Décrivez les tâches que vous souhaitez ajouter..."
            disabled={state === "loading"}
            className="flex-1 bg-transparent text-sm text-text outline-none placeholder:text-text-muted disabled:opacity-60"
          />
          <button
            type="submit"
            aria-label="Générer les tâches"
            disabled={state === "loading" || prompt.trim() === ""}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
          >
            {state === "loading" ? (
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Plus className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </form>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Corps de la phase « input » : idle / loading / unavailable / error  */
/* ------------------------------------------------------------------ */

function InputPhaseBody({
  state,
  errorMessage,
  onLoadSample,
}: {
  state: InputState;
  errorMessage: string;
  onLoadSample?: () => void;
}) {
  if (state === "loading") {
    return (
      <Centered>
        <LoaderCircle className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
        <p className="mt-3 font-medium text-text">Génération en cours…</p>
        <p className="mt-1 text-sm text-text-muted">
          L’IA peut prendre quelques instants pour proposer vos tâches.
        </p>
      </Centered>
    );
  }

  if (state === "unavailable") {
    return (
      <Centered>
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft">
          <WandSparkles className="h-6 w-6 text-primary" aria-hidden="true" />
        </div>
        <p className="mt-3 font-medium text-text">Fonctionnalité IA bientôt disponible</p>
        <p className="mt-1 max-w-sm text-sm text-text-muted">
          La génération automatique de tâches sera activée prochainement (Étape 6). Vous pouvez
          déjà créer vos tâches manuellement.
        </p>
        {onLoadSample && (
          <button
            type="button"
            onClick={onLoadSample}
            className="mt-4 rounded-lg border border-dashed border-border px-3 py-1.5 text-xs font-medium text-text-muted hover:text-text"
          >
            Prévisualiser la revue avec un exemple (dev)
          </button>
        )}
      </Centered>
    );
  }

  if (state === "error") {
    return (
      <Centered>
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-status-todo-bg">
          <TriangleAlert className="h-6 w-6 text-status-todo-fg" aria-hidden="true" />
        </div>
        <p className="mt-3 font-medium text-text">La génération a échoué</p>
        <p className="mt-1 max-w-sm text-sm text-text-muted">{errorMessage}</p>
      </Centered>
    );
  }

  // idle
  return (
    <Centered>
      <Sparkles className="h-8 w-8 text-primary/40" aria-hidden="true" />
      <p className="mt-3 max-w-sm text-sm text-text-muted">
        Décrivez les tâches à créer dans le champ ci-dessous : l’IA vous proposera une liste que
        vous pourrez revoir avant de l’ajouter.
      </p>
    </Centered>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full min-h-[320px] flex-col items-center justify-center px-6 text-center">
      {children}
    </div>
  );
}
