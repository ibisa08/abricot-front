"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, ApiError, toUserMessage } from "@/lib/api";
import type { Project, ProfileUser, Status, Task, UserRef } from "@/types";

/** Clés de cache React Query centralisées. */
export const queryKeys = {
  currentUser: ["current-user"] as const,
  assignedTasks: ["assigned-tasks"] as const,
  projects: ["projects"] as const,
  project: (id: string) => ["project", id] as const,
  projectTasks: (id: string) => ["project-tasks", id] as const,
  userSearch: (query: string) => ["user-search", query] as const,
};

/**
 * Récupère l'utilisateur courant via le BFF (`GET /auth/profile`).
 * Utilisé par la navbar. `retry: false` : un 401 ne doit pas être ré-essayé.
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.currentUser,
    queryFn: async () => {
      const { user } = await api.get<{ user: ProfileUser }>("/auth/profile");
      return user;
    },
    retry: false,
    staleTime: 5 * 60_000,
  });
}

/**
 * Tâches assignées à l'utilisateur courant (`GET /dashboard/assigned-tasks`).
 * Déjà triées côté back (URGENT→LOW puis échéance). Alimente Liste + Kanban.
 */
export function useAssignedTasks() {
  return useQuery({
    queryKey: queryKeys.assignedTasks,
    queryFn: async () => {
      const { tasks } = await api.get<{ tasks: Task[] }>("/dashboard/assigned-tasks");
      return tasks;
    },
  });
}

/** Projets de l'utilisateur (`GET /projects`, tri `updatedAt` desc côté back). */
export function useProjects() {
  return useQuery({
    queryKey: queryKeys.projects,
    queryFn: async () => {
      const { projects } = await api.get<{ projects: Project[] }>("/projects");
      return projects;
    },
  });
}

/** Détail d'un projet (`GET /projects/:id`) : header, membres, `userRole`. */
export function useProject(projectId: string) {
  return useQuery({
    queryKey: queryKeys.project(projectId),
    queryFn: async () => {
      const { project } = await api.get<{ project: Project }>(`/projects/${projectId}`);
      return project;
    },
  });
}

/**
 * Tâches d'un projet (`GET /projects/:id/tasks`) — forme complète (assignés +
 * commentaires). Sert à la progression des cartes ET à la page détail projet.
 * Parallélisé + caché par React Query.
 */
export function useProjectTasks(projectId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.projectTasks(projectId),
    queryFn: async () => {
      const { tasks } = await api.get<{ tasks: Task[] }>(`/projects/${projectId}/tasks`);
      return tasks;
    },
    enabled,
    staleTime: 60_000,
  });
}

/**
 * Recherche d'utilisateurs (`GET /users/search?query=`) pour les pickers de
 * collaborateurs/assignés. Désactivée tant que la requête est vide.
 */
export function useUserSearch(query: string) {
  const trimmed = query.trim();
  return useQuery({
    queryKey: queryKeys.userSearch(trimmed),
    queryFn: async () => {
      const { users } = await api.get<{ users: UserRef[] }>(
        `/users/search?query=${encodeURIComponent(trimmed)}`,
      );
      return users;
    },
    enabled: trimmed.length >= 1,
    staleTime: 60_000,
  });
}

/* ------------------------------------------------------------------ */
/* Mutations                                                          */
/* ------------------------------------------------------------------ */

export interface UpdateTaskStatusInput {
  taskId: string;
  /**
   * Requis pour construire l'URL : le tableau de bord agrège les tâches de
   * plusieurs projets, il n'y a donc pas de projet « courant » implicite.
   */
  projectId: string;
  status: Status;
}

/**
 * Change le seul statut d'une tâche (`PUT /projects/:id/tasks/:taskId`).
 *
 * Le back accepte un corps partiel (docs/BACKEND_API.md) : on n'envoie que
 * `status`, contrairement à `TaskFormModal` qui republie tout le formulaire.
 *
 * Mise à jour optimiste sur `assignedTasks` — c'est la source du Kanban, et un
 * aller-retour réseau après un glisser-déposer ferait revenir la carte dans sa
 * colonne d'origine le temps de la requête.
 */
export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, taskId, status }: UpdateTaskStatusInput) =>
      api.put<{ task: Task }>(`/projects/${projectId}/tasks/${taskId}`, { status }),

    onMutate: async ({ taskId, status }) => {
      /*
       * Indispensable, pas défensif : `assignedTasks` est invalidée par la
       * suppression d'une tâche (TaskRow), la génération IA (AiGenerateModal)
       * et l'édition (TaskFormModal). Un refetch déclenché par l'une d'elles
       * peut se résoudre juste après notre `setQueryData` et écraser
       * silencieusement l'état optimiste. On annule donc les requêtes en vol
       * AVANT de prendre le snapshot, et on attend cette annulation.
       */
      await queryClient.cancelQueries({ queryKey: queryKeys.assignedTasks });

      const previousTasks = queryClient.getQueryData<Task[]>(queryKeys.assignedTasks);

      queryClient.setQueryData<Task[]>(queryKeys.assignedTasks, (current) =>
        current?.map((task) => (task.id === taskId ? { ...task, status } : task)),
      );

      return { previousTasks };
    },

    onError: (error, _variables, context) => {
      // Restauration à l'identique : la carte retourne dans sa colonne d'origine.
      if (context?.previousTasks) {
        queryClient.setQueryData(queryKeys.assignedTasks, context.previousTasks);
      }
      toast.error(
        error instanceof ApiError ? toUserMessage(error) : "Le changement de statut a échoué.",
      );
    },

    // En succès comme en échec : on resynchronise sur le serveur, qui reste
    // l'autorité (tri par priorité, `updatedAt`, compteurs du projet).
    onSettled: (_data, _error, { projectId }) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.assignedTasks });
      void queryClient.invalidateQueries({ queryKey: queryKeys.projectTasks(projectId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.project(projectId) });
    },
  });
}
