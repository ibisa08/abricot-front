import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE } from "@/lib/auth";
import {
  generateTasks,
  AiBadOutputError,
  AiConfigError,
  AiQuotaError,
  AiUnavailableError,
  ContextError,
} from "@/lib/ai";

/**
 * POST /api/ai/generate-tasks — Génération de tâches par IA (Étape 6).
 *
 * Séam BFF : le client n'appelle QUE cette route. Toute la pipeline RAG (load →
 * index → retrieve → generate) et la clé Mistral vivent CÔTÉ SERVEUR. La clé est
 * lue depuis `process.env.MISTRAL_API_KEY`, jamais exposée au navigateur (aucun
 * NEXT_PUBLIC), exactement comme le JWT backend (cf. src/lib/auth.ts + le proxy
 * src/app/api/backend/[...path]). Le client ne voit ni la clé, ni le prompt
 * système, ni le contexte RAG.
 *
 * Body attendu : { projectId: string, prompt: string }
 * Succès       : { success: true, data: { tasks: ProposedTask[] } }
 * Échec        : { success: false, code, message } + status HTTP approprié.
 *
 * Aucune stack trace ne fuit vers le client : chaque erreur typée de la pipeline
 * est mappée sur un code + un message générique.
 */
export async function POST(request: Request) {
  // On valide déjà la forme de la requête.
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

  try {
    // Cookie httpOnly (JWT) : lu côté serveur, attaché en Bearer par la pipeline
    // (comme le proxy /api/backend). Jamais transmis au client.
    const authCookie = (await cookies()).get(AUTH_COOKIE)?.value ?? "";

    const tasks = await generateTasks({ projectId, prompt, authCookie });

    if (tasks.length === 0) {
      // Parse OK mais aucune tâche exploitable : cas métier attendu (200).
      return NextResponse.json({
        success: false,
        code: "AI_EMPTY_RESULT",
        message: "Aucune tâche générée, reformule ta demande.",
      });
    }

    return NextResponse.json({ success: true, data: { tasks } });
  } catch (e) {
    // Clé manquante : log serveur explicite, message générique côté client.
    if (e instanceof AiConfigError) {
      console.error("[AI] Configuration manquante:", e.message);
      return NextResponse.json(
        {
          success: false,
          code: "AI_CONFIG_ERROR",
          message: "Le service IA n'est pas configuré. Contactez un administrateur.",
        },
        { status: 500 },
      );
    }

    // Quota / rate-limit Mistral.
    if (e instanceof AiQuotaError) {
      return NextResponse.json(
        {
          success: false,
          code: "AI_QUOTA_EXCEEDED",
          message: "Quota IA atteint, réessaie plus tard.",
        },
        { status: 429 },
      );
    }

    // Backend injoignable pendant le chargement du contexte.
    if (e instanceof ContextError) {
      console.error("[AI] Contexte projet indisponible:", e.message);
      return NextResponse.json(
        {
          success: false,
          code: "AI_CONTEXT_ERROR",
          message: "Impossible de charger le contexte du projet. Réessaie plus tard.",
        },
        { status: 502 },
      );
    }

    // Sortie LLM impossible à parser.
    if (e instanceof AiBadOutputError) {
      console.error("[AI] Sortie LLM illisible:", e.message);
      return NextResponse.json(
        {
          success: false,
          code: "AI_BAD_OUTPUT",
          message: "La réponse de l'IA était illisible. Reformule ta demande.",
        },
        { status: 502 },
      );
    }

    // Timeout / API indisponible / 5xx Mistral, et tout imprévu (sans fuite).
    if (!(e instanceof AiUnavailableError)) {
      console.error("[AI] Erreur inattendue lors de la génération:", e);
    }
    return NextResponse.json(
      {
        success: false,
        code: "AI_UNAVAILABLE",
        message: "Service IA momentanément indisponible.",
      },
      { status: 503 },
    );
  }
}
