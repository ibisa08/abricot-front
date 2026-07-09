"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Project, Task, User, UserRef } from "@/types";

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
      const { user } = await api.get<{ user: User }>("/auth/profile");
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
