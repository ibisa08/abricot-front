"use client";

import { useEffect, useId, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { LoaderCircle } from "lucide-react";
import { api, ApiError, toUserMessage } from "@/lib/api";
import { projectSchema, type ProjectValues } from "@/lib/validation";
import { queryKeys } from "@/lib/queries";
import { Modal } from "@/components/ui/Modal";
import { Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { UserMultiSelect, type SelectedUser } from "@/components/ui/UserMultiSelect";
import type { Project } from "@/types";

export interface ProjectFormModalProps {
  mode: "create" | "edit";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Requis en mode édition (préremplissage + diff contributeurs). */
  project?: Project;
}

/**
 * Modale de création / édition de projet.
 * - create : POST /projects { name, description, contributors: emails[] }.
 * - edit   : PUT /projects/:id { name, description } (le back n'accepte PAS les
 *   contributeurs ici) + diff des contributeurs via POST/DELETE dédiés.
 */
export function ProjectFormModal({ mode, open, onOpenChange, project }: ProjectFormModalProps) {
  const queryClient = useQueryClient();
  const nameId = useId();
  const descId = useId();
  const contribId = useId();

  const [contributors, setContributors] = useState<SelectedUser[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    trigger,
    formState: { errors, isValid, isSubmitting },
  } = useForm<ProjectValues>({
    resolver: zodResolver(projectSchema),
    mode: "onChange",
    defaultValues: { name: "", description: "" },
  });

  // (Ré)initialise le formulaire à chaque ouverture.
  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && project) {
      reset({ name: project.name, description: project.description ?? "" });
      setContributors(project.members.map((m) => m.user));
      void trigger(); // calcule isValid sur des valeurs préremplies
    } else {
      reset({ name: "", description: "" });
      setContributors([]);
    }
  }, [open, mode, project, reset, trigger]);

  const createMutation = useMutation({
    mutationFn: (body: { name: string; description: string; contributors: string[] }) =>
      api.post<{ project: Project }>("/projects", body),
  });

  async function submitCreate(values: ProjectValues) {
    await createMutation.mutateAsync({
      name: values.name,
      description: values.description,
      contributors: contributors.map((u) => u.email),
    });
    await queryClient.invalidateQueries({ queryKey: queryKeys.projects });
    toast.success("Projet créé.");
    onOpenChange(false);
  }

  async function submitEdit(values: ProjectValues) {
    if (!project) return;
    // 1) Nom + description (PUT n'accepte que ces champs).
    await api.put<{ project: Project }>(`/projects/${project.id}`, {
      name: values.name,
      description: values.description,
    });

    // 2) Diff des contributeurs (initial = membres du projet).
    const initial = project.members.map((m) => m.user);
    const finalEmails = new Set(contributors.map((u) => u.email));
    const initialEmails = new Set(initial.map((u) => u.email));
    const toAdd = contributors.filter((u) => !initialEmails.has(u.email));
    const toRemove = initial.filter((u) => !finalEmails.has(u.email));

    const results = await Promise.allSettled([
      ...toAdd.map((u) => api.post(`/projects/${project.id}/contributors`, { email: u.email })),
      ...toRemove.map((u) => api.del(`/projects/${project.id}/contributors/${u.id}`)),
    ]);

    await queryClient.invalidateQueries({ queryKey: queryKeys.projects });
    onOpenChange(false);

    const failed = results.filter((r) => r.status === "rejected").length;
    if (failed > 0) {
      toast.warning(
        `Projet enregistré, mais ${failed} modification(s) de l'équipe ont échoué.`,
      );
    } else {
      toast.success("Projet mis à jour.");
    }
  }

  async function onSubmit(values: ProjectValues) {
    try {
      if (mode === "create") await submitCreate(values);
      else await submitEdit(values);
    } catch (err) {
      const message =
        err instanceof ApiError ? toUserMessage(err) : "Une erreur est survenue. Réessayez.";
      toast.error(message);
    }
  }

  const isCreate = mode === "create";
  const canSubmit = isValid && !isSubmitting;

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isCreate ? "Créer un projet" : "Modifier un projet"}
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <div>
          <Label htmlFor={nameId}>Titre*</Label>
          <Input
            id={nameId}
            placeholder="Nom du projet"
            invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? `${nameId}-error` : undefined}
            {...register("name")}
          />
          {errors.name && (
            <p id={`${nameId}-error`} role="alert" className="mt-1.5 text-xs font-medium text-status-todo-fg">
              {errors.name.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor={descId}>Description*</Label>
          <Textarea
            id={descId}
            placeholder="Décrivez le projet en quelques mots"
            invalid={Boolean(errors.description)}
            aria-describedby={errors.description ? `${descId}-error` : undefined}
            {...register("description")}
          />
          {errors.description && (
            <p id={`${descId}-error`} role="alert" className="mt-1.5 text-xs font-medium text-status-todo-fg">
              {errors.description.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor={contribId}>Contributeurs</Label>
          <UserMultiSelect
            id={contribId}
            mode="emails"
            value={contributors}
            onChange={setContributors}
            placeholder="Choisir un ou plusieurs collaborateurs"
          />
        </div>

        <div className="pt-2">
          <Button type="submit" variant="ink" disabled={!canSubmit} className="min-w-44">
            {isSubmitting ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                {isCreate ? "Création…" : "Enregistrement…"}
              </>
            ) : isCreate ? (
              "Ajouter un projet"
            ) : (
              "Enregistrer"
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
