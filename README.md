# Abricot

**Abricot** est un SaaS de gestion de tâches et de projets collaboratifs.

L'application permet de créer des projets, d'y organiser des tâches, d'assigner
plusieurs membres, de commenter, et de **générer des tâches assistée par IA**
(Mistral + LlamaIndex.TS) à partir du contexte d'un projet.

## Stack

**Front (ce dépôt)**

- [Next.js 15](https://nextjs.org) (App Router) + React 19
- TypeScript
- Tailwind CSS
- Radix UI (Dialog, Popover, Select, Tabs, Dropdown…)
- TanStack Query (data fetching / cache)
- React Hook Form + Zod (formulaires & validation)
- dnd-kit (`core`, `sortable`, `utilities`) — glisser-déposer du Kanban

**IA (côté serveur, via le BFF Next)**

- Mistral (`@llamaindex/mistral`) orchestré avec [LlamaIndex.TS](https://ts.llamaindex.ai) (`llamaindex`)

**Backend (dépôt séparé)**

- Express / Prisma / SQLite — exposé sur `http://localhost:8000`

## Prérequis

- Node.js 20+
- npm
- **Le backend Express, dans un dépôt séparé :
  https://github.com/ibisa08/abricot-backend** — à lancer en parallèle sur le
  port `8000`.

Le front ne fonctionne pas seul : comptes, projets, tâches et commentaires
viennent tous du backend. Pour le mettre en route une première fois :

```bash
git clone https://github.com/ibisa08/abricot-backend.git
cd abricot-backend
cp .env.example .env      # puis changer la valeur de JWT_SECRET
npm install
npx prisma generate
npx prisma migrate deploy
npm run seed              # crée le compte de démo alice@example.com
npm run dev               # → http://localhost:8000
```

Le README du backend détaille ces étapes, ainsi que la configuration de la
connexion Google.

## Installation

```bash
npm install
npx playwright install chromium
```

`npm install` pose `@playwright/test`, mais **pas le navigateur qu'il pilote** :
sans la seconde commande, `npm run test:e2e` échoue sur un exécutable Chromium
introuvable. Elle n'est à lancer qu'une fois par machine, et peut être omise si
l'on ne joue pas les tests end-to-end.

## Variables d'environnement

Copier `.env.example` vers `.env.local` et renseigner les valeurs :

```bash
cp .env.example .env.local
```

| Variable                  | Description                                                                                                                                                                                                                |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `BACKEND_URL`             | URL du backend Express (appels serveur→serveur via le BFF).                                                                                                                                                                |
| `NEXT_PUBLIC_BACKEND_URL` | URL du backend telle que le **navigateur** doit la voir. Sert à construire le lien « Continuer avec Google », qui est une navigation pleine page vers le backend. Inlinée dans le bundle client : n'y mettre aucun secret. |
| `MISTRAL_API_KEY`         | Clé API Mistral, lue **uniquement côté serveur** pour la génération de tâches IA. Jamais exposée au navigateur.                                                                                                            |

Les deux premières valent la même chose en développement (`http://localhost:8000`),
mais elles sont distinctes par nature : `BACKEND_URL` est résolue côté serveur
Next, `NEXT_PUBLIC_BACKEND_URL` côté navigateur. En production, elles peuvent
différer (réseau interne contre URL publique).

> ⚠️ Ne jamais commiter de vraie clé. `MISTRAL_API_KEY` reste dans `.env.local`
> (ignoré par git). Une clé s'obtient sur
> [console.mistral.ai](https://console.mistral.ai).

**Sans `MISTRAL_API_KEY`, la génération IA n'est pas désactivée pour autant.**
La clé est lue côté serveur uniquement : le navigateur ne peut pas savoir
qu'elle manque, et le bouton « IA » de la page d'un projet est donc rendu sans
condition. L'absence n'est détectée qu'au moment de la génération — la route
`/api/ai/generate-tasks` répond alors un `500` de code `AI_CONFIG_ERROR`, et la
modale affiche « Le service IA n'est pas configuré. Contactez un
administrateur. ». Le reste de l'application n'est pas affecté : projets,
tâches, commentaires et Kanban restent pleinement fonctionnels.

## Lancer le projet

Front (ce dépôt) :

```bash
npm run dev
# → http://localhost:3000
```

Backend (dépôt séparé) : le démarrer en parallèle sur le port `8000`.

### Compte de test

Utiliser le compte de démonstration fourni avec le backend, ou créer un compte
depuis la page d'inscription (`/signin`).

## Fonctionnalités

- **Tableau de bord** (`/dashboard`) — deux onglets : une **vue Liste** de vos
  tâches assignées, dotée d'une recherche côté client sur le titre et la
  description, et une **vue Kanban** à trois colonnes où le statut se change au
  glisser-déposer (détaillée plus bas).
- **Projets** (`/projets`) — création, modification et suppression, avec gestion
  des contributeurs par autocomplétion sur l'email.
- **Détail d'un projet** (`/projets/[id]`) — également deux onglets :
  - **Liste** : les tâches du projet, créables et modifiables, assignables à
    plusieurs membres à la fois ;
  - **Calendrier** : les mêmes tâches regroupées par **jour d'échéance**, du plus
    proche au plus lointain, celles sans date étant rassemblées en fin de vue
    sous « Sans échéance ».

  Une recherche et un **filtre par statut** (Tous, À faire, En cours, Terminée,
  Annulée) s'appliquent aux **deux onglets simultanément** : changer d'onglet ne
  réinitialise pas le tri en cours.
- **Commentaires de tâches** — chaque tâche porte son fil de discussion. Tout
  membre du projet peut commenter ; l'édition et la suppression sont réservées à
  l'auteur du commentaire.
- **Génération de tâches par IA** — voir la section dédiée dans
  [Fonctionnalités bonus](#fonctionnalités-bonus).
- **Mon compte** (`/compte`) — profil et changement de mot de passe.

## Authentification

Deux méthodes de connexion coexistent :

- **email / mot de passe** — formulaires `/login` et `/signin` ;
- **Google (OAuth 2.0)** — bouton « Continuer avec Google », présent sur les deux
  pages sous le formulaire.

Dans les deux cas, le JWT émis par le backend est déposé dans un cookie httpOnly
`abricot_token` par un route handler Next. **Le JWT ne transite jamais par le
JavaScript du navigateur** : il n'est ni lu, ni stocké, ni manipulé côté client.
Les appels authentifiés passent par le proxy `/api/backend/[...path]`, qui lit le
cookie côté serveur et ajoute l'en-tête `Authorization: Bearer`.

### Flux de connexion Google

```
1. NAVIGATEUR ──── clic « Continuer avec Google » ────▶ BACKEND
                   GET http://localhost:8000/auth/google
                   (navigation pleine page — un fetch ne suivrait pas
                    la redirection vers Google)

2. BACKEND ──── Set-Cookie: oauth_state (httpOnly, 10 min) ────▶ NAVIGATEUR
           └─── 302 vers l'écran de consentement Google

3. NAVIGATEUR ──── consentement de l'utilisateur ────▶ GOOGLE

4. GOOGLE ──── 302 ?code=…&state=… ────▶ BACKEND
               GET http://localhost:8000/auth/google/callback

5. BACKEND · compare le state reçu au cookie oauth_state, puis le supprime
           · échange le code contre les tokens Google et vérifie l'id_token
           · exige email_verified === true
           · retrouve le compte lié, sinon le rattache par email,
             sinon crée un compte sans mot de passe
           · émet un code à usage unique, valable 60 s
           └─── 302 ────▶ NAVIGATEUR
                http://localhost:3000/auth/callback?code=<code>

6. FRONT (page /auth/callback, client) ──── POST { code } ────▶ ROUTE HANDLER NEXT
                                            /api/auth/oauth/exchange

7. ROUTE HANDLER (serveur) ──── POST ────▶ BACKEND
                                /auth/oauth/exchange
                           ◀─── { user, token }
                           · Set-Cookie: abricot_token (httpOnly, 7 jours)
                           └─── renvoie { user } SANS le token ────▶ NAVIGATEUR

8. NAVIGATEUR ──── redirection ────▶ /dashboard
```

Le code de l'étape 5 est à usage unique et expire au bout de 60 secondes. C'est
lui, et non le JWT, qui transite par l'URL du navigateur : le JWT n'est obtenu
qu'à l'étape 7, par un appel serveur→serveur.

### Fichiers concernés

| Fichier                                       | Rôle                                                                             |
| --------------------------------------------- | -------------------------------------------------------------------------------- |
| `src/lib/oauth.ts`                            | URL de départ du flux (depuis `NEXT_PUBLIC_BACKEND_URL`) et libellés des erreurs |
| `src/components/auth/GoogleAuthSection.tsx`   | Séparateur « ou » et lien Google (`<a>`, jamais un `fetch`)                      |
| `src/app/auth/callback/page.tsx`              | Page de retour : écran de chargement pendant l'échange                           |
| `src/components/auth/OAuthCallbackClient.tsx` | Déclenche l'échange dès le montage, une seule fois                               |
| `src/app/api/auth/oauth/exchange/route.ts`    | Échange serveur→serveur et pose du cookie                                        |
| `src/components/auth/OAuthErrorAlert.tsx`     | Affiche le message correspondant à `?error=` sur `/login`                        |
| `src/middleware.ts`                           | `/auth/callback` est une route publique : l'utilisateur en revient sans cookie   |

### Erreurs

En cas d'échec, le backend redirige vers `/login?error=<code>`. Les codes
`oauth_state`, `oauth_email_unverified`, `oauth_denied`, `oauth_missing_code`,
`oauth_unavailable`, `oauth_init_failed` et `oauth_failed` sont traduits en
messages utilisateur dans `src/lib/oauth.ts`.

### Comptes Google et mot de passe

Un compte créé via Google n'a pas de mot de passe local. `GET /auth/profile`
renvoie `hasPassword: false` pour ces comptes, et la page « Mon compte » remplace
alors le formulaire de changement de mot de passe par une mention explicite.

### Configuration côté backend

Le flux exige que le backend définisse `GOOGLE_CLIENT_ID`,
`GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` et `FRONTEND_URL` (voir le dépôt du
backend). L'URI de redirection doit être déclarée à l'identique dans la Google
Cloud Console. Si ces variables manquent, le backend le signale au démarrage et
le bouton Google renvoie vers `/login?error=oauth_unavailable` ; la connexion par
email et mot de passe reste fonctionnelle.

## Tests end-to-end (Playwright)

Sept scénarios couvrent les parcours critiques : connexion (échec puis succès),
protection des routes privées, création d'un projet, création d'une tâche, et
deux déplacements Kanban — au clavier, puis à la souris vers une colonne vide.

### Pourquoi une base de test séparée

Les tests **écrivent** en base : ils créent des projets et des tâches. Les faire
tourner sur la base de développement la polluerait à chaque exécution et rendrait
les résultats dépendants de son état. Le backend expose donc une instance dédiée
sur le port `8001`, avec son propre fichier SQLite (`db.test.sqlite`),
réinitialisable à volonté.

L'adresse de ce backend n'est écrite **qu'à un seul endroit** du dépôt :
`e2e/config.ts`. `playwright.config.ts` l'injecte dans le serveur Next via
`webServer.env`, sous le nom `BACKEND_URL`. Une variable présente dans
l'environnement du processus prime sur `.env.local`, ce qui garantit que les
tests ne visent jamais le backend de développement — sans dupliquer la valeur
dans un fichier `.env` supplémentaire.

Pour la même raison, `reuseExistingServer` vaut `false` : réutiliser un serveur
Next déjà lancé ferait tourner les tests contre la base de développement, en
silence. **Le port 3000 doit donc être libre.**

### Prérequis

Deux serveurs, dans deux terminaux :

| Terminal | Dépôt             | Rôle                                              |
| -------- | ----------------- | ------------------------------------------------- |
| 1        | `abricot-backend` | Backend de test, port `8001`                      |
| 2        | `abricot-front`   | Lancé automatiquement par Playwright, port `3000` |

Le front n'a pas à être démarré à la main : Playwright s'en charge, avec la bonne
configuration. S'il tourne déjà sur le port 3000, l'arrêter avant.

### Séquence de lancement

```bash
# 1. Backend — dans le dépôt backend, une seule fois :
#    créer le fichier de configuration de test
cp .env.test.example .env.test

# 2. Backend — réinitialiser la base de test et la peupler
npm run db:test:reset

# 3. Backend — démarrer le serveur de test (laisser tourner)
npm run dev:test          # → http://localhost:8001

# 4. Front — dans ce dépôt, sur un autre terminal, port 3000 libre
npm run test:e2e
```

Si le backend de test n'est pas joignable, la suite s'arrête immédiatement avec
un message rappelant ces étapes, plutôt que d'échouer test par test.

La réinitialisation (étape 2) n'est pas nécessaire avant chaque exécution : les
tests créent des données portant un nom unique et ne dépendent pas de l'état
laissé par une exécution précédente. La relancer de temps en temps évite
simplement que la base de test n'enfle.

> **Arrêter le serveur de test avant toute réinitialisation.** `db:test:reset`
> supprime le fichier SQLite avant de le recréer. Un serveur `dev:test` encore
> actif en conserve un descripteur ouvert : il continue de répondre, mais toute
> écriture échoue en **500 sans message explicite**, et les tests deviennent
> illisibles. L'ordre est donc : couper `dev:test`, réinitialiser, relancer.

### Scripts

| Script                | Rôle                                                     |
| --------------------- | -------------------------------------------------------- |
| `npm run test:e2e`    | Exécute la suite (Chromium, un worker)                   |
| `npm run test:e2e:ui` | Mode interactif : exécution pas à pas, inspection du DOM |

En cas d'échec, la trace et la capture d'écran sont conservées dans
`test-results/`, et le rapport HTML dans `playwright-report/`
(`npx playwright show-report`). Rien n'est conservé quand tout passe.

### Conventions

- Sélecteurs accessibles uniquement (`getByRole`, `getByLabel`, `getByText`) :
  un test qui casse parce qu'une classe CSS a changé n'apprend rien, et un
  élément inatteignable par ces méthodes signale généralement un défaut
  d'accessibilité à corriger dans l'application.
- Aucune attente fixe : les attentes automatiques de Playwright suffisent.
- Aucune assertion sur les commentaires : le seed en tire le nombre et l'auteur
  au hasard (`Math.random`), toute vérification serait instable.
- La connexion passe par le helper `e2e/helpers/auth.ts`, réutilisé par tous les
  tests qui exigent une session.
- Chaque test est indépendant de l'ordre d'exécution : contexte navigateur neuf,
  connexion explicite, et noms de données uniques.

## Scripts utiles

| Script                 | Rôle                                |
| ---------------------- | ----------------------------------- |
| `npm run dev`          | Serveur de dev (port 3000)          |
| `npm run build`        | Build de production                 |
| `npm run start`        | Sert le build de production         |
| `npm run lint`         | ESLint                              |
| `npm run format`       | Prettier (écriture)                 |
| `npm run format:check` | Prettier (vérification seule)       |
| `npm run test:e2e`     | Tests end-to-end Playwright         |
| `npm run test:e2e:ui`  | Tests end-to-end en mode interactif |

## Documentation

Le dossier [`docs/`](docs/) rassemble les documents de conception :

| Document | Contenu |
|----------|---------|
| [`docs/BACKEND_API.md`](docs/BACKEND_API.md) | Contrat de l'API consommée par le front : routes, formats de requête et de réponse |
| [`docs/DESIGN.md`](docs/DESIGN.md) | Parti pris visuel : palette, typographie, composants |
| [`docs/maquettes/`](docs/maquettes/) | Maquettes de tous les écrans et de toutes les modales, y compris celles de la génération IA |

## Fonctionnalités bonus

Éléments implémentés au-delà du cahier des charges. Chaque entrée indique le
choix technique **et la raison** qui l'a motivé.

### Génération de tâches par IA (RAG — Mistral + LlamaIndex.TS)

Fichiers : `src/lib/ai/` (`index.ts`, `loadContext.ts`, `buildIndex.ts`,
`retrieve.ts`, `generate.ts`, `errors.ts`, `types.ts`),
`src/app/api/ai/generate-tasks/route.ts`,
`src/components/tasks/AiGenerateModal.tsx`,
`src/components/tasks/ProposedTaskReview.tsx`.

Sur la page d'un projet, le bouton **« IA »** ouvre une modale où l'on décrit en
langage naturel ce que l'on veut faire (« préparer la mise en production »). Le
modèle propose une liste de tâches que l'on **revoit avant** toute écriture :
chaque carte est éditable et supprimable, et rien n'est créé tant que « Ajouter
les tâches » n'a pas été cliqué. Le modèle n'écrit donc jamais directement en
base : il propose, l'utilisateur dispose.

**Pourquoi du RAG plutôt qu'un simple appel au modèle.** Une génération à
l'aveugle produit des tâches génériques et, surtout, repropose ce qui existe
déjà. Le contexte du projet — nom, description, tâches en cours — est donc
indexé puis interrogé avec la demande, pour que le modèle voie l'état réel du
projet avant de proposer quoi que ce soit.

Le pipeline tient en une étape par module, pour rester débogable pas à pas
(`src/lib/ai/index.ts` orchestre) :

| Étape | Module | Rôle |
|-------|--------|------|
| 0 · config | `errors.ts` | Lit `MISTRAL_API_KEY` et échoue tôt et clair si elle manque |
| 1 · load | `loadContext.ts` | `GET /projects/:id` sur le backend, Bearer posé côté serveur → nom, description, tâches existantes |
| 2 · index | `buildIndex.ts` | Un `Document` par tâche existante + un pour le projet, puis un `VectorStoreIndex` **en mémoire** (embeddings `mistral-embed`) |
| 3 · retrieve | `retrieve.ts` | Ramène les 5 passages les plus proches de la demande, dédoublonnés |
| 4 · generate | `generate.ts` | `mistral-small-latest` à température 0.2, prompt système « JSON pur », puis validation |

L'index est **reconstruit à chaque requête et vit en mémoire**. Le volume en jeu
— une description et quelques dizaines de tâches — ne justifie pas une base
vectorielle externe, et cela évite d'avoir à invalider un index persistant à
chaque tâche créée ou modifiée. Les étapes Mistral sont bornées par un timeout
dur de 30 secondes.

La sortie du modèle est **validée, pas seulement parsée** : `priority` et
`status` sont contraints aux valeurs attendues par le backend (à défaut
`MEDIUM` et `TODO`), `dueDate` doit être une date ISO 8601, et une tâche sans
titre est rejetée. Une réponse illisible devient une erreur typée plutôt que des
cartes cassées à l'écran.

**Tout passe par le BFF.** Le client n'appelle que `POST /api/ai/generate-tasks` ;
la clé Mistral, le prompt système et le contexte RAG restent côté serveur —
aucun préfixe `NEXT_PUBLIC_`, donc rien dans le bundle navigateur — exactement
comme le JWT dans le proxy `/api/backend/[...path]`. Chaque erreur du pipeline
est typée (`AiConfigError`, `ContextError`, `AiQuotaError`, `AiUnavailableError`,
`AiBadOutputError`) puis traduite en un code et un message français : aucune
trace d'exécution ne remonte au navigateur.

### TanStack Query — cache et états des données serveur

Fichiers : `src/lib/queries.ts`, `src/app/providers.tsx`.

Les données du backend sont de l'état _serveur_ : elles sont partagées, elles
peuvent devenir obsolètes, et plusieurs composants les demandent en même temps.
Les gérer avec `useState` + `useEffect` obligerait à réécrire, dans chaque
composant, la déduplication des requêtes, le cache, l'invalidation après
écriture et les états `isLoading` / `isError`. TanStack Query fournit ces
mécanismes une fois pour toutes.

- **Clés centralisées** dans l'objet `queryKeys` (`src/lib/queries.ts`).
  Invalider un cache suppose de désigner la clé exacte : des chaînes littérales
  disséminées dans les composants divergent tôt ou tard, et une clé mal
  orthographiée n'échoue pas — elle laisse simplement l'écran afficher des
  données périmées. Un objet unique rend l'erreur visible à la compilation.
- **`staleTime` global de 30 s** (`src/app/providers.tsx`). Sans lui, chaque
  montage de composant redéclenche une requête ; la navigation entre le tableau
  de bord et un projet en produirait plusieurs par seconde, sans que l'écran
  change. `useProjectTasks` et `useUserSearch` le portent à 60 s, leurs données
  bougeant encore moins vite.
- **`refetchOnWindowFocus` désactivé**. Par défaut, tout retour sur l'onglet
  relance les requêtes. Dans une application où l'on bascule vers un autre
  onglet en cours de saisie, cela remplace les données sous un formulaire ou une
  modale ouverte, pour un gain de fraîcheur nul dans les faits. La fraîcheur est
  obtenue autrement : chaque mutation invalide explicitement les clés qu'elle
  affecte.

### Tailwind CSS — approche utility-first et tokens de design

Fichiers : `tailwind.config.ts`, `src/app/globals.css`, `src/app/layout.tsx`.

Les styles sont écrits en classes utilitaires, au plus près du balisage. Ce
choix supprime la couche de nommage intermédiaire d'un CSS classique — celle où
l'on invente des noms de classes puis où l'on cherche qui les utilise encore.
En contrepartie, il expose au risque de voir des valeurs brutes se répandre dans
le code : c'est ce que la couche de tokens empêche.

Les couleurs déclarées dans `tailwind.config.ts` ne contiennent aucune valeur
hexadécimale ; elles pointent vers les variables CSS de `:root`
(`src/app/globals.css`), qui restent la source de vérité unique au runtime. Une
couleur se corrige à un seul endroit.

Les polices — **Manrope** pour les titres, **Inter** pour le corps — sont
chargées par `next/font/google` et exposées comme variables CSS
(`--font-manrope`, `--font-inter`). Elles sont donc auto-hébergées : pas de
requête vers un domaine tiers, et pas de saut de mise en page au chargement.

**Les tokens de couleur ont été calibrés pour respecter le contraste WCAG AA**,
et les ratios mesurés sont notés en commentaire à côté de chaque variable. La
palette compte deux oranges plutôt qu'un seul, précisément pour cette raison :
`--color-primary` (#D3590B) plafonne à 4,03:1 sur blanc, ce qui satisfait le
seuil de 3:1 des grands titres et des éléments graphiques mais pas les 4,5:1
exigés pour du texte courant ; `--color-primary-text` (#C2410C, 5,17:1) prend le
relais dès que l'orange sert de petit texte. Les couleurs de texte des badges de
statut ont été assombries pour tenir 4,5:1 sur leur propre fond, et non
seulement sur blanc. L'alternative aurait été de changer la couleur de marque ou
d'accepter un échec de contraste.

### Autocomplétion sur la sélection de collaborateurs

Fichiers : `src/components/ui/UserMultiSelect.tsx`, `src/lib/queries.ts`
(`useUserSearch`), route backend `GET /users/search`.

Ajouter un contributeur à un projet suppose de désigner un utilisateur par son
email — une chaîne exacte, que l'utilisateur devrait retranscrire sans faute
dans un champ libre. La moindre coquille produit une erreur que rien ne permet
de corriger à l'aveugle. L'autocomplétion transforme cette saisie en
**sélection** dans une liste de personnes existantes.

Fonctionnement : la frappe alimente une recherche débouncée (~300 ms, à partir
de 2 caractères) sur `GET /users/search` ; les résultats s'affichent dans une
liste navigable aux flèches ↑/↓ et validable à Entrée ; la sélection est
multiple et se matérialise en puces retirables, `Backspace` sur un champ vide
retirant la dernière. Le débounce évite une requête par frappe, qui chargerait
le backend pour des résultats jetés aussitôt.

Le composant sert deux cas avec deux clés d'identité (prop `mode`) : `emails`
pour les contributeurs d'un projet, `ids` pour les assignés d'une tâche. Dans ce
second cas, une prop `options` fournit la liste fermée des membres du projet et
le filtrage se fait localement, sans appel réseau — on ne peut assigner une
tâche qu'à quelqu'un qui appartient déjà au projet.

L'ensemble suit le motif ARIA _combobox_ sur une base Radix Popover, pour rester
utilisable au clavier et avec un lecteur d'écran.

### Vue Kanban et glisser-déposer

Fichiers : `src/components/dashboard/TaskBoard.tsx`,
`src/components/dashboard/BoardTaskCard.tsx`,
`src/components/dashboard/boardColumns.ts`, `src/lib/queries.ts`
(`useUpdateTaskStatus`).

Le tableau de bord propose une vue Kanban à trois colonnes — À faire, En cours,
Terminées — où le statut d'une tâche se change en déplaçant sa carte. Le statut
est la seule donnée modifiée : le type `Task` n'a pas de champ de position, un
ordre choisi à la souris serait perdu au premier rafraîchissement. La stratégie
de tri passée à `SortableContext` est donc neutre, pour ne pas laisser croire à
un classement que rien ne persiste.

**Souris et clavier.** Le déplacement repose sur `@dnd-kit`, avec deux capteurs :
`PointerSensor`, dont le seuil de 5 px distingue un clic d'un glissement, et
`KeyboardSensor`. Le geste part d'une poignée dédiée et non de la carte entière,
qui contient déjà un lien « Voir » : la rendre déplaçable imbriquerait deux
éléments interactifs. Au clavier, Espace saisit la carte, les flèches gauche et
droite choisissent la colonne, Espace dépose, Échap annule.

**Détection de la colonne visée.** La détection de collision est restreinte aux
zones de dépôt de colonne. `closestCorners` classe les cibles par distance entre
coins homologues ; comme la grille étire les colonnes à la hauteur de la plus
haute, leur géométrie n'a plus rien de comparable à celle d'une carte. Une
colonne vide n'était alors jamais retenue, et un dépôt dessus enregistrait le
statut de la colonne voisine. Ne comparer que les trois colonnes rétablit une
géométrie homogène.

**Annonces lecteur d'écran.** `DndContext` reçoit des annonces en français pour
le début du geste, le survol d'une colonne, le dépôt et l'annulation, ainsi que
les instructions lues à la prise de focus sur une poignée. Une région
`aria-live` distincte, maintenue montée en permanence, confirme l'issue de
l'enregistrement : les annonces de `@dnd-kit` décrivent le geste, pas son
résultat.

**Mise à jour optimiste.** `useUpdateTaskStatus` écrit le nouveau statut dans le
cache TanStack Query avant la réponse du serveur, pour que la carte reste là où
elle a été lâchée. Les requêtes en vol sur `assignedTasks` sont annulées avant
la prise de l'instantané : un rafraîchissement déclenché ailleurs pourrait sinon
se résoudre juste après et écraser l'état optimiste. En cas d'échec,
l'instantané est restauré, un toast d'erreur s'affiche et la région `aria-live`
signale que la tâche est restée dans sa colonne d'origine.

### Authentification Google (OAuth 2.0)

Connexion via Google en plus du couple email / mot de passe, le JWT restant dans
un cookie httpOnly hors de portée du JavaScript navigateur. Flux détaillé,
fichiers concernés et codes d'erreur : voir la section
[Authentification](#authentification).

### Tests end-to-end (Playwright)

Les parcours critiques sont couverts par une suite Playwright s'exécutant contre
une base de test isolée, distincte de la base de développement. Prérequis,
séquence de lancement et conventions : voir la section
[Tests end-to-end (Playwright)](#tests-end-to-end-playwright).
