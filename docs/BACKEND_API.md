# Contrat d'API — Backend Abricot

> Reverse-engineered depuis le code Express/Prisma fourni (`dev-react-P10-main`).
> **Source de vérité pour toute requête du front.** Ne rien inventer qui ne soit pas ici.

## Généralités

- **Base URL** : `http://localhost:8000`
- **Auth** : JWT dans le header `Authorization: Bearer <token>` sur les routes privées.
- **Le token n'est JAMAIS exposé au navigateur.** Il vit dans un cookie httpOnly posé par le BFF Next (voir `docs/DESIGN.md` §Auth). Les *route handlers* Next relaient vers ce back en attachant le Bearer.
- **CORS back** : n'autorise que `http://localhost:8000` et `http://localhost:8001`. Sans importance avec le BFF (appels serveur→serveur).

### Enveloppe de réponse (toutes les routes)

```jsonc
// succès
{ "success": true,  "message": "…", "data": { /* payload */ } }
// erreur simple
{ "success": false, "message": "…", "error": "CODE_ERREUR" }
// erreur de validation (400)
{ "success": false, "message": "…", "error": "Validation failed",
  "data": { "errors": [ { "field": "email", "message": "Format d'email invalide" } ] } }
```

Le front doit systématiquement lire `data` en cas de succès et remonter `message` (+ `data.errors`) en cas d'échec.

### Règle mot de passe (register + change password)

Regex back : `^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$`
→ min **8** caractères, **1 minuscule, 1 majuscule, 1 chiffre, 1 spécial** parmi `@$!%*?&`.
À dupliquer côté front (zod) pour un feedback immédiat, mais le back reste l'autorité.

### Comptes de seed (mot de passe commun : `P@ssword123`)

`alice@example.com` (propriétaire principal), `bob@example.com`, `caroline@example.com`, `david@example.com`, `emma@example.com`, `francois@example.com`, `gabrielle@example.com`, `henri@example.com`, `isabelle@example.com`, `jacques@example.com`.

---

## Authentification & profil

| Méthode | Route | Accès | Body | Réponse `data` |
|---|---|---|---|---|
| POST | `/auth/register` | public | `{ email, password, name? }` | `{ user:{id,email,name,createdAt}, token }` (201) |
| POST | `/auth/login` | public | `{ email, password }` | `{ user:{id,email,name,createdAt}, token }` |
| GET | `/auth/profile` | privé | — | `{ user:{id,email,name} }` |
| PUT | `/auth/profile` | privé | `{ name?, email? }` | `{ user:{id,email,name,createdAt,updatedAt} }` |
| PUT | `/auth/password` | privé | `{ currentPassword, newPassword }` | message seul |

Codes d'erreur notables : `EMAIL_ALREADY_EXISTS` (409), `INVALID_CREDENTIALS` (401),
`INVALID_CURRENT_PASSWORD` (401). `name` doit faire ≥ 2 caractères s'il est fourni.
`newPassword` doit passer la regex **et** être différent de l'actuel.

> **Mon compte** : le back n'a qu'un champ `name`. Mapper `Prénom Nom` → `name` (concat) à l'enregistrement, et *split* à l'affichage (1er mot = prénom, reste = nom).

---

## Utilisateurs (pour les pickers contributeurs / assignés)

| Méthode | Route | Accès | Query | Réponse `data` |
|---|---|---|---|---|
| GET | `/users/search` | privé | `?query=<texte>` | `{ users:[{id,email,name}] }` (max 10) |

Recherche sur nom/email. Utilisé par les `<select multiple>` "Choisir un ou plusieurs collaborateurs".

---

## Projets

| Méthode | Route | Accès | Body | Réponse `data` |
|---|---|---|---|---|
| POST | `/projects` | privé | `{ name, description?, contributors?: string[] }` | `{ project }` (201) |
| GET | `/projects` | privé | — | `{ projects: Project[] }` (tri `updatedAt` desc) |
| GET | `/projects/:id` | privé (accès projet) | — | `{ project: Project & { tasks[], userRole } }` |
| PUT | `/projects/:id` | privé (**admin**) | `{ name?, description? }` | `{ project }` |
| DELETE | `/projects/:id` | privé (**propriétaire**) | — | message seul |
| POST | `/projects/:id/contributors` | privé (**admin**) | `{ email, role?: 'ADMIN'\|'CONTRIBUTOR' }` | message seul |
| DELETE | `/projects/:id/contributors/:userId` | privé (**admin**) | — | message seul |

- `contributors` = **tableau d'emails** (pas d'IDs) à la création.
- Le créateur devient **propriétaire** automatiquement.
- Contraintes : `name` 2–100, `description` ≤ 500.

### Forme d'un `Project`

```ts
type Project = {
  id: string; name: string; description: string | null;
  createdAt: string; updatedAt: string;
  ownerId: string;
  owner: { id: string; email: string; name: string | null };
  members: { id: string; role: 'ADMIN' | 'CONTRIBUTOR'; joinedAt: string;
             user: { id: string; email: string; name: string | null } }[];
  _count: { tasks: number };            // total de tâches
  userRole?: 'ADMIN' | 'CONTRIBUTOR' | null;  // ajouté par GET /projects et GET /projects/:id
  tasks?: Task[];                        // uniquement sur GET /projects/:id
};
```

> ⚠️ **Rôles** : `getUserProjectRole` renvoie `ADMIN` **aussi pour le propriétaire**. Pour distinguer *propriétaire* d'*admin simple* (droits DELETE projet, badge "Propriétaire"), comparer `project.ownerId === utilisateurCourant.id`. `userRole` sert à décider Admin vs Contributeur vs (null = pas d'accès → 403).
>
> **Progression carte projet** : `_count.tasks` donne le total, pas le nb de tâches terminées. Pour "X/Y tâches terminées" et la barre %, faire un `GET /projects/:id/tasks` par carte (React Query, parallélisé + caché) et compter `status === 'DONE'`. Optimisable côté back plus tard.

---

## Tâches (imbriquées sous un projet)

| Méthode | Route | Accès | Body | Réponse `data` |
|---|---|---|---|---|
| POST | `/projects/:id/tasks` | privé (accès projet) | `{ title, description?, priority?, dueDate?, assigneeIds?: string[] }` | `{ task }` (201) |
| GET | `/projects/:id/tasks` | privé | — | `{ tasks: Task[] }` (tri priorité desc puis date) |
| GET | `/projects/:id/tasks/:taskId` | privé | — | `{ task }` |
| PUT | `/projects/:id/tasks/:taskId` | privé | `{ title?, description?, status?, priority?, dueDate?, assigneeIds? }` | `{ task }` |
| DELETE | `/projects/:id/tasks/:taskId` | privé | — | message seul |

- ⚠️ **`POST` n'accepte PAS `status`** → toute tâche naît en `TODO`. Pour honorer le statut choisi dans la modale "Créer une tâche" : créer, puis si `status !== 'TODO'`, enchaîner un `PUT …/:taskId { status }`.
- `assigneeIds` = **tableau d'IDs utilisateurs** (≠ contributeurs projet qui sont des emails).
- `dueDate` = ISO string ; optionnel côté back mais **requis dans la maquette** "Créer une tâche" → forcer côté front.
- `priority` ∈ `LOW|MEDIUM|HIGH|URGENT` (aucune maquette ne l'expose → laisser `MEDIUM`).
- `status` ∈ `TODO|IN_PROGRESS|DONE|CANCELLED`. Libellés UI : `À faire | En cours | Terminée | Annulée`.
- Contraintes : `title` 2–200, `description` ≤ 1000.

### Forme d'une `Task`

```ts
type Task = {
  id: string; title: string; description: string | null;
  status: 'TODO'|'IN_PROGRESS'|'DONE'|'CANCELLED';
  priority: 'LOW'|'MEDIUM'|'HIGH'|'URGENT';
  dueDate: string | null; createdAt: string; updatedAt: string;
  projectId: string; creatorId: string;
  creator: { id: string; email: string; name: string | null };
  project: { id: string; name: string };
  assignees: { id: string; assignedAt: string;
               user: { id: string; email: string; name: string | null } }[];
  comments: Comment[];
};
```

---

## Commentaires (imbriqués sous une tâche)

| Méthode | Route | Accès | Body | Réponse `data` |
|---|---|---|---|---|
| POST | `/projects/:id/tasks/:taskId/comments` | privé | `{ content }` | commentaire créé |
| GET | `/projects/:id/tasks/:taskId/comments` | privé | — | liste |
| GET | `/projects/:id/tasks/:taskId/comments/:commentId` | privé | — | 1 commentaire |
| PUT | `/projects/:id/tasks/:taskId/comments/:commentId` | privé | `{ content }` | commentaire màj |
| DELETE | `/projects/:id/tasks/:taskId/comments/:commentId` | privé | — | message seul |

`content` : 1–2000 caractères.

```ts
type Comment = {
  id: string; content: string; createdAt: string; updatedAt: string;
  taskId: string; authorId: string;
  author: { id: string; email: string; name: string | null };
};
```

---

## Tableau de bord (dashboard)

| Méthode | Route | Réponse `data` |
|---|---|---|
| GET | `/dashboard/assigned-tasks` | `{ tasks: Task[] }` — tâches assignées à l'utilisateur, **triées URGENT→LOW puis échéance** (inclut `project`, `assignees`, `comments`) |
| GET | `/dashboard/projects-with-tasks` | `{ projects: … }` — projets où l'utilisateur a des tâches assignées |
| GET | `/dashboard/stats` | `{ stats }` (voir ci-dessous) |

```ts
type DashboardStats = {
  tasks: { total: number; urgent: number; overdue: number;
           byStatus: Record<'TODO'|'IN_PROGRESS'|'DONE'|'CANCELLED', number> };
  projects: { total: number };
};
```

> **Dashboard = tâches assignées à MOI** (pas toutes les tâches). La vue Liste et la vue Kanban du dashboard consomment `/dashboard/assigned-tasks`. Le back ne filtre pas "du mois" → filtrer côté front si besoin pour coller à la spec ("tâches du mois par statut").

---

## Démarrer le backend (rappel)

```bash
cd dev-react-P10-main
cp .env.example .env            # mettre un vrai JWT_SECRET
npm install
npx prisma generate
npx prisma migrate deploy
npm run seed                    # 10 users, mdp P@ssword123
npm run dev                     # http://localhost:8000, Swagger sur /api-docs
```
