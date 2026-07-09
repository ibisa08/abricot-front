/**
 * Types du domaine Abricot — conformes à docs/BACKEND_API.md.
 * Ne rien inventer qui ne soit pas dans le contrat d'API.
 */

/* ------------------------------------------------------------------ */
/* Enums (unions littérales)                                           */
/* ------------------------------------------------------------------ */

/** Statut d'une tâche. Libellés UI : À faire | En cours | Terminée | Annulée. */
export type Status = "TODO" | "IN_PROGRESS" | "DONE" | "CANCELLED";

/** Priorité d'une tâche (aucune maquette ne l'expose → défaut MEDIUM). */
export type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

/** Rôle d'un membre au sein d'un projet. */
export type Role = "ADMIN" | "CONTRIBUTOR";

/* ------------------------------------------------------------------ */
/* Enveloppe de réponse (toutes les routes du back)                    */
/* ------------------------------------------------------------------ */

/** Détail d'une erreur de validation (400). */
export interface FieldError {
  field: string;
  message: string;
}

/**
 * Enveloppe standard renvoyée par le back sur toutes les routes.
 * En cas de succès : `data` porte le payload.
 * En cas d'erreur : `message` + `error` (+ `data.errors` en validation).
 */
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T & { errors?: FieldError[] };
}

/* ------------------------------------------------------------------ */
/* Utilisateur                                                         */
/* ------------------------------------------------------------------ */

/** Référence utilisateur minimale telle qu'imbriquée dans les autres entités. */
export interface UserRef {
  id: string;
  email: string;
  name: string | null;
}

/**
 * Utilisateur. Le back n'a qu'un champ `name` (mapper `Prénom Nom` → `name`).
 * `createdAt`/`updatedAt` ne sont présents que sur certaines routes de profil.
 */
export interface User {
  id: string;
  email: string;
  name: string | null;
  createdAt?: string;
  updatedAt?: string;
}

/* ------------------------------------------------------------------ */
/* Projet                                                              */
/* ------------------------------------------------------------------ */

/** Membre d'un projet (association user ↔ projet + rôle). */
export interface ProjectMember {
  id: string;
  role: Role;
  joinedAt: string;
  user: UserRef;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  owner: UserRef;
  members: ProjectMember[];
  /** Total de tâches (pas le nombre de tâches terminées). */
  _count: { tasks: number };
  /** Ajouté par GET /projects et GET /projects/:id. `null` = pas d'accès. */
  userRole?: Role | null;
  /** Présent uniquement sur GET /projects/:id. */
  tasks?: Task[];
}

/* ------------------------------------------------------------------ */
/* Tâche                                                              */
/* ------------------------------------------------------------------ */

/** Assignation d'un utilisateur à une tâche. */
export interface TaskAssignee {
  id: string;
  assignedAt: string;
  user: UserRef;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: Status;
  priority: Priority;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  projectId: string;
  creatorId: string;
  creator: UserRef;
  project: { id: string; name: string };
  assignees: TaskAssignee[];
  comments: Comment[];
}

/* ------------------------------------------------------------------ */
/* Commentaire                                                        */
/* ------------------------------------------------------------------ */

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  taskId: string;
  authorId: string;
  author: UserRef;
}

/* ------------------------------------------------------------------ */
/* Tableau de bord                                                    */
/* ------------------------------------------------------------------ */

export interface DashboardStats {
  tasks: {
    total: number;
    urgent: number;
    overdue: number;
    byStatus: Record<Status, number>;
  };
  projects: {
    total: number;
  };
}
