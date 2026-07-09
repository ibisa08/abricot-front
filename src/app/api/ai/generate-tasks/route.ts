import { NextResponse } from "next/server";

/**
 * POST /api/ai/generate-tasks — STUB (Étape 6 de la mission).
 *
 * Séam BFF pour la génération de tâches par IA (RAG + LLM). Pour l'instant :
 * AUCUN appel LLM, AUCUNE fausse tâche renvoyée. La fonctionnalité n'est pas
 * encore branchée : c'est un état MÉTIER ATTENDU, pas une panne serveur. On
 * répond donc par un HTTP 200 portant `success: false` + le code explicite
 * `AI_NOT_IMPLEMENTED`, que le client sait interpréter pour basculer sur l'état
 * « bientôt disponible ». (Un 501 ferait apparaître un « Failed to load
 * resource » rouge, non supprimable, dans la console du navigateur — à éviter
 * pour un cas nominal.) Les vrais échecs (500, timeout, quota) resteront, eux,
 * des statuts d'erreur.
 *
 * ⚠️ SÉCURITÉ — quand la vraie génération sera branchée (Étape 6) :
 *   La clé de l'API LLM (Anthropic/OpenAI/…) DOIT rester côté serveur, lue
 *   depuis `process.env` (ex. `process.env.LLM_API_KEY`), et ne JAMAIS être
 *   exposée au navigateur — exactement comme le JWT backend (voir
 *   `src/lib/auth.ts` + le proxy `src/app/api/backend/[...path]`). Le client
 *   n'appelle que cette route ; il ne voit ni la clé, ni le prompt système, ni
 *   le contexte RAG.
 *
 * Body attendu : { projectId: string, prompt: string }
 * Réponse cible (Étape 6) : { success: true, data: { tasks: ProposedTask[] } }
 * où ProposedTask = { title, description, dueDate?, status? }.
 */
export async function POST(request: Request) {
  // On valide déjà la forme de la requête (utile tel quel pour l'Étape 6).
  let body: { projectId?: unknown; prompt?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    // Corps illisible → traité comme requête invalide ci-dessous.
  }

  const projectId = typeof body.projectId === "string" ? body.projectId : "";
  const prompt = typeof body.prompt === "string" ? body.prompt : "";

  if (!projectId || prompt.trim() === "") {
    return NextResponse.json(
      {
        success: false,
        code: "INVALID_REQUEST",
        message: "Les champs `projectId` et `prompt` sont requis.",
      },
      { status: 400 },
    );
  }

  // ────────────────────────────────────────────────────────────────────
  // TODO (Étape 6) — BRANCHER ICI la vraie génération, et NULLE PART AILLEURS :
  //   1. Récupérer le contexte du projet (RAG) via le backend Express,
  //      en attachant le Bearer côté serveur (cf. proxy /api/backend).
  //   2. Appeler le LLM avec `process.env.LLM_API_KEY` (jamais côté client).
  //   3. Mapper la réponse en ProposedTask[] et renvoyer :
  //        return NextResponse.json({ success: true, data: { tasks } });
  //   Le reste de l'UI (revue, édition, commit des tâches) est déjà prêt.
  // ────────────────────────────────────────────────────────────────────
  // 200 volontaire : cas métier attendu (pas une erreur serveur) → console propre.
  return NextResponse.json({
    success: false,
    code: "AI_NOT_IMPLEMENTED",
    message: "Génération IA à implémenter (Étape 6)",
  });
}
