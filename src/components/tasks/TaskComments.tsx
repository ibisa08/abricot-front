"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Send, LoaderCircle } from "lucide-react";
import { api, ApiError, toUserMessage } from "@/lib/api";
import { queryKeys } from "@/lib/queries";
import { commentSchema } from "@/lib/validation";
import { formatDateTime } from "@/lib/format";
import { Avatar } from "@/components/ui/Avatar";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import type { Comment } from "@/types";

export interface TaskCommentsProps {
  projectId: string;
  taskId: string;
  comments: Comment[];
  currentUserId?: string;
  /** Nom de l'utilisateur courant (avatar du champ d'ajout). */
  currentUserName?: string | null;
}

/**
 * Fil de commentaires d'une tâche : liste (auteur, date, contenu),
 * ajout, et édition/suppression réservées à l'auteur.
 * Toute mutation invalide les tâches du projet (les commentaires y sont imbriqués).
 */
export function TaskComments({
  projectId,
  taskId,
  comments,
  currentUserId,
  currentUserName,
}: TaskCommentsProps) {
  const queryClient = useQueryClient();
  const base = `/projects/${projectId}/tasks/${taskId}/comments`;

  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.projectTasks(projectId) });

  const addMutation = useMutation({
    mutationFn: (content: string) => api.post(`${base}`, { content }),
    onSuccess: async () => {
      setDraft("");
      await invalidate();
    },
    onError: (err) =>
      toast.error(err instanceof ApiError ? toUserMessage(err) : "L'ajout du commentaire a échoué."),
  });

  const editMutation = useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      api.put(`${base}/${id}`, { content }),
    onSuccess: async () => {
      setEditingId(null);
      await invalidate();
      toast.success("Commentaire modifié.");
    },
    onError: (err) =>
      toast.error(err instanceof ApiError ? toUserMessage(err) : "La modification a échoué."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.del(`${base}/${id}`),
    onSuccess: async () => {
      await invalidate();
      toast.success("Commentaire supprimé.");
    },
    onError: (err) =>
      toast.error(err instanceof ApiError ? toUserMessage(err) : "La suppression a échoué."),
  });

  function submitAdd(e: React.FormEvent) {
    e.preventDefault();
    const parsed = commentSchema.safeParse({ content: draft });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Commentaire invalide.");
      return;
    }
    addMutation.mutate(parsed.data.content);
  }

  function submitEdit(id: string) {
    const parsed = commentSchema.safeParse({ content: editValue });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Commentaire invalide.");
      return;
    }
    editMutation.mutate({ id, content: parsed.data.content });
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-3">
        {comments.length === 0 && (
          <li className="text-sm text-text-muted">Aucun commentaire pour l’instant.</li>
        )}
        {comments.map((comment) => {
          const isAuthor = comment.author.id === currentUserId;
          const isEditing = editingId === comment.id;
          return (
            <li key={comment.id} className="flex gap-3 rounded-xl bg-bg p-3">
              <Avatar name={comment.author.name ?? comment.author.email} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-sm font-medium text-text">
                    {comment.author.name ?? comment.author.email}
                  </span>
                  <span className="shrink-0 text-xs text-text-muted">
                    {formatDateTime(comment.createdAt)}
                  </span>
                </div>

                {isEditing ? (
                  <div className="mt-1.5">
                    <Textarea
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      aria-label="Modifier le commentaire"
                      className="min-h-16"
                    />
                    <div className="mt-2 flex gap-2">
                      <Button
                        size="sm"
                        variant="ink"
                        onClick={() => submitEdit(comment.id)}
                        disabled={editMutation.isPending}
                      >
                        Enregistrer
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                        Annuler
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-0.5 whitespace-pre-wrap text-sm text-text">{comment.content}</p>
                )}

                {isAuthor && !isEditing && (
                  <div className="mt-1.5 flex items-center gap-3 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(comment.id);
                        setEditValue(comment.content);
                      }}
                      className="font-medium text-text-muted hover:text-text"
                    >
                      Modifier
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteMutation.mutate(comment.id)}
                      disabled={deleteMutation.isPending}
                      className="font-medium text-status-todo-fg hover:underline"
                    >
                      Supprimer
                    </button>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {/* Ajout */}
      <form onSubmit={submitAdd} className="flex items-start gap-3">
        <Avatar name={currentUserName ?? "Moi"} size="sm" />
        <div className="min-w-0 flex-1">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Ajouter un commentaire..."
            aria-label="Ajouter un commentaire"
            className="min-h-16"
          />
          <div className="mt-2 flex justify-end">
            <Button
              type="submit"
              variant="ink"
              size="sm"
              disabled={draft.trim().length === 0 || addMutation.isPending}
            >
              {addMutation.isPending ? (
                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Send className="h-4 w-4" aria-hidden="true" />
              )}
              Envoyer
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
