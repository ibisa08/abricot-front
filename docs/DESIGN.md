# Design & Architecture front — Abricot

> Source de vérité visuelle + technique. Les maquettes exportées sont dans `docs/maquettes/`.
> À lire avec `docs/BACKEND_API.md`.

## 1. Stack retenue (justifiable en soutenance)

| Domaine | Choix | Justification |
|---|---|---|
| Framework | **Next.js (App Router) + TypeScript** | imposé par la spec ; App Router = techno recommandée |
| Styles | **Tailwind CSS** | rapidité + tokens centralisés ; suggéré dans la mission |
| Primitives UI | **Radix UI** (`Dialog`, `Select`, `DropdownMenu`, `Popover`, `Tabs`) | **accessibilité WCAG AA gratuite** : focus trap, navigation clavier, ARIA corrects sur modales/menus/selects |
| Icônes | **lucide-react** | cohérent, arbre secouable, `aria-hidden` faciles |
| Data fetching | **TanStack Query** | cache, invalidation, états loading/error propres |
| Formulaires + validation | **react-hook-form + zod** | valide côté client les mêmes règles que le back |
| Dates | **date-fns** (locale `fr`) | format "9 mars", tri échéances |
| Toasts | **sonner** | notifications succès/erreur non bloquantes |

## 2. Design tokens

### Couleurs (à mettre dans `tailwind.config` + variables CSS `:root`)

```css
--color-primary:        #EA580C; /* orange Abricot (logo, liens, accents, ✦ IA) */
--color-primary-hover:  #C2410C;
--color-primary-soft:   #FFF1E9; /* fond onglet actif / badge "Propriétaire" */
--color-ink:            #1A1A1A; /* boutons d'action pleins + texte fort */
--color-ink-hover:      #000000;
--color-bg:             #F5F5F7; /* fond de page gris très clair */
--color-surface:        #FFFFFF; /* cartes, navbar, modales */
--color-border:         #ECECEC;
--color-text:           #1A1A1A;
--color-text-muted:     #6B7280;

/* Badges de statut */
--todo-bg:    #FFE4E1;  --todo-fg:    #E5484D; /* À faire  (TODO)        */
--doing-bg:   #FEF3C7;  --doing-fg:   #B45309; /* En cours (IN_PROGRESS) */
--done-bg:    #DCFCE7;  --done-fg:    #15803D; /* Terminée (DONE)        */
--cancel-bg:  #F1F1F3;  --cancel-fg:  #6B7280; /* Annulée  (CANCELLED)   */
```

### Typographie

- **Titres** : `Poppins` (600/700) — aspect rond et moderne des headings ("Connexion", "Tableau de bord").
- **Corps** : `Inter` (400/500) — labels, textes, méta.
- Charger via `next/font/google`. Titres orange sur les pages auth (`Connexion`/`Inscription`).

### Rayons & ombres

- Cartes : `rounded-2xl` (~16px), bordure `1px --color-border`, ombre très légère.
- Inputs / boutons : `rounded-lg` (~8–10px).
- Avatars : cercle, fond `--color-primary-soft`, initiales en `--color-primary` ; **avatar de l'utilisateur courant dans la navbar = fond plein orange**.

## 3. Layout global (navbar + footer)

- **Navbar** (blanche, sticky) : logo Abricot à gauche (retour `/dashboard`) ; centre = 2 liens **Tableau de bord** (`/dashboard`) et **Projets** (`/projets`) — l'actif est une **pastille noire** (fond `--color-ink`, texte blanc, icône) ; l'inactif = icône orange + texte foncé. À droite = **avatar** (initiales) menu → `Mon compte` (`/compte`) + `Se déconnecter`.
- **Footer** (blanc) : logo + « Abricot 2025 » à droite.
- Layout appliqué à toutes les pages connectées ; **absent** des pages `/login` et `/signin`.

## 4. Composants transverses

- `<StatusBadge status>` : mappe TODO/IN_PROGRESS/DONE/CANCELLED → libellé FR + couleurs ci-dessus. `role="status"`.
- `<Avatar name>` / `<AvatarGroup>` : initiales (2 lettres). `alt`/`aria-label` = nom complet.
- `<Button variant="ink|accent|soft|ghost">` : `ink` = noir plein (actions primaires) ; `accent` = orange (✦ IA, liens forts) ; `soft` = fond orange clair (onglet actif) ; `ghost`.
- `<TaskCard>` : titre + `StatusBadge`, description, méta (📁 projet | 📅 échéance | 💬 nb commentaires), bouton **Voir** noir. Réutilisée en Liste et Kanban.
- `<ProjectCard>` : titre, description, **barre de progression** + %, « X/Y tâches terminées », « Équipe (n) » + avatars + badge « Propriétaire ». Cliquable → `/projets/:id`.
- `<UserMultiSelect>` : recherche via `/users/search`, sélection multiple (contributeurs = emails ; assignés = IDs). Clavier + ARIA (Radix).
- `<Modal>` : wrapper Radix `Dialog` (overlay, focus trap, `Esc`, croix ✕ en haut-droite, `aria-labelledby`).

## 5. Architecture BFF & authentification (sécurité)

**Objectif** : le JWT ne doit jamais être lisible en JS navigateur (pas de `localStorage`). Exigence sécu + auto-éval.

```
Navigateur ──fetch /api/...──▶ Route Handlers Next (serveur) ──Bearer──▶ Express :8000
                                     ▲ cookie httpOnly abricot_token
```

Fichiers :

- `src/app/api/auth/login/route.ts` (POST) : relaie `/auth/login`, récupère `{user,token}`, pose le cookie **httpOnly, sameSite=lax, secure en prod, path=/**, renvoie `{user}` (jamais le token).
- `src/app/api/auth/register/route.ts` (POST) : idem `/auth/register`.
- `src/app/api/auth/logout/route.ts` (POST) : supprime le cookie.
- `src/app/api/backend/[...path]/route.ts` : **proxy générique authentifié** (GET/POST/PUT/DELETE) qui lit le cookie, ajoute `Authorization: Bearer …`, et forwarde vers `${BACKEND_URL}/<path>`. Le client appelle donc `/api/backend/projects`, `/api/backend/projects/:id/tasks`, etc.
- `src/lib/api.ts` : petit client typé (`api.get/post/put/del`) qui tape `/api/backend/*` et déballe l'enveloppe `{success,data,message}`.
- `src/middleware.ts` : garde de routes (middleware Next.js — `export function middleware(request: NextRequest)` + `config.matcher`) — pas de cookie sur une route privée → redirect `/login` ; cookie présent sur `/login`|`/signin` → redirect `/dashboard`. (La vraie autorité reste le back : tout 401 renvoyé par le proxy API `/api/backend/*` déclenche un logout + redirect.)
- `.env.local` : `BACKEND_URL=http://localhost:8000`.

> L'IA (Étape 6) suivra le même principe : `src/app/api/ai/generate-tasks/route.ts` côté serveur pour ne jamais exposer la clé LLM. Stubbé pour l'instant.

## 6. Arborescence cible

```
src/
  app/
    (auth)/login/page.tsx
    (auth)/signin/page.tsx
    (app)/layout.tsx            # navbar + footer, protège via middleware
    (app)/dashboard/page.tsx
    (app)/projets/page.tsx
    (app)/projets/[id]/page.tsx
    (app)/compte/page.tsx
    api/auth/{login,register,logout}/route.ts
    api/backend/[...path]/route.ts
    api/ai/generate-tasks/route.ts   # stub
    not-found.tsx                # page 404 (exigée par l'auto-éval)
    layout.tsx                   # fonts, Providers (React Query + Toaster)
  components/{ui,layout,projects,tasks,dashboard,account,modals}/
  lib/{api.ts,auth.ts,queries.ts,format.ts,validation.ts}
  types/index.ts
```

## 7. Accessibilité (WCAG AA — bloquant pour l'auto-éval)

- Toutes les images décoratives : `aria-hidden`; les images signifiantes (photo auth) : `alt` descriptif.
- Chaque input a un `<label htmlFor>`. Erreurs liées via `aria-describedby` + `aria-invalid`.
- Modales/menus/selects via Radix (déjà conformes). `Esc` ferme, focus piégé, focus restauré.
- Navigation clavier complète (Tab/Shift+Tab/Enter/Espace/flèches sur Kanban et selects).
- Contrastes ≥ AA (vérifier l'orange sur blanc pour le texte fin — sinon foncer le texte).
- Cible : **0 erreur WAVE**, **0 erreur console**.
