# Abricot

**Abricot** est un SaaS de gestion de tâches et de projets collaboratifs.
Projet réalisé dans le cadre du parcours **OpenClassrooms — Projet 11**.

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
| `MISTRAL_API_KEY` | Clé API Mistral, lue **uniquement côté serveur** pour la génération de tâches IA. Jamais exposée au navigateur. |

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

## Scripts utiles

| Script                | Rôle                                  |
| --------------------- | ------------------------------------- |
| `npm run dev`         | Serveur de dev (port 3000)            |
| `npm run build`       | Build de production                   |
| `npm run start`       | Sert le build de production           |
| `npm run lint`        | ESLint                                |
| `npm run format`      | Prettier (écriture)                   |
