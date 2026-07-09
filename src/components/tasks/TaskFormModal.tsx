"use client";

import { useEffect, useId, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { api, ApiError, toUserMessage } from "@/lib/api";
import { taskSchema, type TaskValues } from "@/lib/validation";
import { queryKeys } from "@/lib/queries";
import { Modal } from "@/components/ui/Modal";
import { Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { UserMultiSelect, type SelectedUser } from "@/components/ui/UserMultiSelect";
import type { Status, Task } from "@/types";

export interface TaskFormModalProps {
  mode: "create" | "edit";
  projectId: string;
  /** Candidats assignables = propriétaire + membres du projet. */
  teamOptions: SelectedUser[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Requis en mode édition. */
  task?: Task;
}

/** Chips de statut proposés à la création/édition (l'API n'expose pas CANCELLED ici). */
const STATUS_CHIPS: { value: Extract<Status, "TODO" | "IN_PROGRESS" | "DONE">; label: string; classes: string }[] =
  [
    { value: "TODO", label: "À faire", classes: "bg-status-todo-bg text-status-todo-fg" },
    { value: "IN_PROGRESS", label: "En cours", classes: "bg-status-doing-bg text-status-doing-fg" },
    { value: "DONE", label: "Terminée", classes: "bg-status-done-bg text-status-done-fg" },
  ];

/** ISO "yyyy-mm-dd" → "yyyy-mm-dd" pour `<input type="date">` (sans dérive de fuseau). */
function toDateInput(iso: string | null): string {
  return iso ? iso.slice(0, 10) : "";
}

export function TaskFormModal({
  mode,
  projectId,
  teamOptions,
  open,
  onOpenChange,
  task,
}: TaskFormModalProps) {
  const queryClient = useQueryClient();
  const titleId = useId();
  const descId = useId();
  const dueId = useId();
  const assigneeId = useId();

  const [assignees, setAssignees] = useState<SelectedUser[]>([]);
  const [status, setStatus] = useState<Status | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    trigger,
    formState: { errors, isValid },
  } = useForm<TaskValues>({
    resolver: zodResolver(taskSchema),
    mode: "onChange",
    defaultValues: { title: "", description: "", dueDate: "" },
  });

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && task) {
      reset({
        title: task.title,
        description: task.description ?? "",
        dueDate: toDateInput(task.dueDate),
      });
      setAssignees(task.assignees.map((a) => a.user));
      setStatus(task.status);
      void trigger();
    } else {
      reset({ title: "", description: "", dueDate: "" });
      setAssignees([]);
      setStatus(null);
    }
  }, [open, mode, task, reset, trigger]);

  async function onSubmit(values: TaskValues) {
    setSubmitting(true);
    const dueDateISO = `${values.dueDate}T00:00:00.000Z`;
    const assigneeIds = assignees.map((u) => u.id);

    try {
      if (mode === "create") {
        // POST n'accepte PAS status → créer, puis PUT si statut ≠ TODO.
        const { task: created } = await api.post<{ task: Task }>(
          `/projects/${projectId}/tasks`,
          {
            title: values.title,
            description: values.description,
            dueDate: dueDateISO,
            assigneeIds,
          },
        );
        if (status && status !== "TODO") {
          await api.put(`/projects/${projectId}/tasks/${created.id}`, { status });
        }
        toast.success("Tâche créée.");
      } else if (task) {
        // PUT accepte status directement.
        await api.put(`/projects/${projectId}/tasks/${task.id}`, {
          title: values.title,
          description: values.description,
          status: status ?? task.status,
          dueDate: dueDateISO,
          assigneeIds,
        });
        toast.success("Tâche mise à jour.");
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.projectTasks(projectId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.project(projectId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.assignedTasks }),
      ]);
      onOpenChange(false);
    } catch (err) {
      const message =
        err instanceof ApiError ? toUserMessage(err) : "Une erreur est survenue. Réessayez.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  const isCreate = mode === "create";
  const canSubmit = isValid && !submitting;

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={isCreate ? "Créer une tâche" : "Modifier"}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <div>
          <Label htmlFor={titleId}>Titre*</Label>
          <Input
            id={titleId}
            placeholder="Nom de la tâche"
            invalid={Boolean(errors.title)}
            aria-describedby={errors.title ? `${titleId}-error` : undefined}
            {...register("title")}
          />
          {errors.title && (
            <p id={`${titleId}-error`} role="alert" className="mt-1.5 text-xs font-medium text-status-todo-fg">
              {errors.title.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor={descId}>Description*</Label>
          <Textarea
            id={descId}
            placeholder="Décrivez la tâche"
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
          <Label htmlFor={dueId}>Échéance*</Label>
          <Input
            id={dueId}
            type="date"
            invalid={Boolean(errors.dueDate)}
            aria-describedby={errors.dueDate ? `${dueId}-error` : undefined}
            {...register("dueDate")}
          />
          {errors.dueDate && (
            <p id={`${dueId}-error`} role="alert" className="mt-1.5 text-xs font-medium text-status-todo-fg">
              {errors.dueDate.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor={assigneeId}>Assigné à :</Label>
          <UserMultiSelect
            id={assigneeId}
            mode="ids"
            options={teamOptions}
            value={assignees}
            onChange={setAssignees}
            placeholder="Choisir un ou plusieurs collaborateurs"
          />
        </div>

        <fieldset>
          <legend className="mb-1.5 block text-sm font-medium text-text">Statut :</legend>
          <div className="flex flex-wrap gap-2">
            {STATUS_CHIPS.map((chip) => {
              const active = status === chip.value;
              return (
                <button
                  key={chip.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setStatus(active ? null : chip.value)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium transition",
                    chip.classes,
                    active
                      ? "ring-2 ring-primary ring-offset-1"
                      : "opacity-60 hover:opacity-100",
                  )}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="pt-2">
          <Button type="submit" variant="ink" disabled={!canSubmit} className="min-w-44">
            {submitting ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                {isCreate ? "Ajout…" : "Enregistrement…"}
              </>
            ) : isCreate ? (
              "+ Ajouter une tâche"
            ) : (
              "Enregistrer"
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
