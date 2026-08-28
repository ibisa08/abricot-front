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

**IA (côté serveur, via le BFF Next)**
- Mistral (`@llamaindex/mistral`) orchestré avec [LlamaIndex.TS](https://ts.llamaindex.ai) (`llamaindex`)

**Backend (dépôt séparé)**
- Express / Prisma / SQLite — exposé sur `http://localhost:8000`

## Prérequis

- Node.js 20+
- npm
- Le backend Express lancé en parallèle (voir son propre dépôt) sur le port `8000`

## Installation

```bash
npm install
```

## Variables d'environnement

Copier `.env.example` vers `.env.local` et renseigner les valeurs :

```bash
cp .env.example .env.local
```

| Variable          | Description                                                        |
| ----------------- | ------------------------------------------------------------------ |
| `BACKEND_URL`     | URL du backend Express (appels serveur→serveur via le BFF).         |
| `NEXT_PUBLIC_BACKEND_URL` | URL du backend telle que le **navigateur** doit la voir. Sert à construire le lien « Continuer avec Google », qui est une navigation pleine page vers le backend. Inlinée dans le bundle client : n'y mettre aucun secret. |
| `MISTRAL_API_KEY` | Clé API Mistral, lue **uniquement côté serveur** pour la génération de tâches IA. Jamais exposée au navigateur. |

Les deux premières valent la même chose en développement (`http://localhost:8000`),
mais elles sont distinctes par nature : `BACKEND_URL` est résolue côté serveur
Next, `NEXT_PUBLIC_BACKEND_URL` côté navigateur. En production, elles peuvent
différer (réseau interne contre URL publique).

> ⚠️ Ne jamais commiter de vraie clé. `MISTRAL_API_KEY` reste dans `.env.local`
> (ignoré par git). Sans cette clé, la génération IA se désactive proprement
> (les autres fonctionnalités restent disponibles).

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

| Fichier | Rôle |
| ------- | ---- |
| `src/lib/oauth.ts` | URL de départ du flux (depuis `NEXT_PUBLIC_BACKEND_URL`) et libellés des erreurs |
| `src/components/auth/GoogleAuthSection.tsx` | Séparateur « ou » et lien Google (`<a>`, jamais un `fetch`) |
| `src/app/auth/callback/page.tsx` | Page de retour : écran de chargement pendant l'échange |
| `src/components/auth/OAuthCallbackClient.tsx` | Déclenche l'échange dès le montage, une seule fois |
| `src/app/api/auth/oauth/exchange/route.ts` | Échange serveur→serveur et pose du cookie |
| `src/components/auth/OAuthErrorAlert.tsx` | Affiche le message correspondant à `?error=` sur `/login` |
| `src/middleware.ts` | `/auth/callback` est une route publique : l'utilisateur en revient sans cookie |

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

Quatre scénarios couvrent les parcours critiques : connexion (échec puis succès),
protection des routes privées, création d'un projet, création d'une tâche.

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

| Terminal | Dépôt | Rôle |
| -------- | ----- | ---- |
| 1 | `abricot-backend` | Backend de test, port `8001` |
| 2 | `abricot-front` | Lancé automatiquement par Playwright, port `3000` |

Le front n'a pas à être démarré à la main : Playwright s'en charge, avec la bonne
configuration. S'il tourne déjà sur le port 3000, l'arrêter avant.

### Séquence de lancement

```bash
# 1. Backend — une seule fois, pour créer le fichier de configuration de test
cd ~/abricot-backend
cp .env.test.example .env.test

# 2. Backend — réinitialiser la base de test et la peupler
npm run db:test:reset

# 3. Backend — démarrer le serveur de test (laisser tourner)
npm run dev:test          # → http://localhost:8001

# 4. Front — dans un autre terminal, port 3000 libre
cd ~/abricot-front
npm run test:e2e
```

Si le backend de test n'est pas joignable, la suite s'arrête immédiatement avec
un message rappelant ces étapes, plutôt que d'échouer test par test.

La réinitialisation (étape 2) n'est pas nécessaire avant chaque exécution : les
tests créent des données portant un nom unique et ne dépendent pas de l'état
laissé par une exécution précédente. La relancer de temps en temps évite
simplement que la base de test n'enfle.

### Scripts

| Script                | Rôle                                                     |
| --------------------- | -------------------------------------------------------- |
| `npm run test:e2e`    | Exécute la suite (Chromium, un worker)                    |
| `npm run test:e2e:ui` | Mode interactif : exécution pas à pas, inspection du DOM  |

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

| Script                | Rôle                                  |
| --------------------- | ------------------------------------- |
| `npm run dev`         | Serveur de dev (port 3000)            |
| `npm run build`       | Build de production                   |
| `npm run start`       | Sert le build de production           |
| `npm run lint`        | ESLint                                |
| `npm run format`      | Prettier (écriture)                   |
| `npm run test:e2e`    | Tests end-to-end Playwright           |
| `npm run test:e2e:ui` | Tests end-to-end en mode interactif   |

## Fonctionnalités bonus

Éléments implémentés au-delà du cahier des charges. Chaque entrée indique le
choix technique **et la raison** qui l'a motivé.

### TanStack Query — cache et états des données serveur

Fichiers : `src/lib/queries.ts`, `src/app/providers.tsx`.

Les données du backend sont de l'état *serveur* : elles sont partagées, elles
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

L'ensemble suit le motif ARIA *combobox* sur une base Radix Popover, pour rester
utilisable au clavier et avec un lecteur d'écran.

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
