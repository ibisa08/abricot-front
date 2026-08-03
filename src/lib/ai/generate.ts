import { Settings } from "llamaindex";
import type { MessageContent } from "@llamaindex/core/llms";
import { AiBadOutputError } from "@/lib/ai/errors";
import type { ProposedTask } from "@/lib/ai/types";
import type { Priority, Status } from "@/types";

const PRIORITIES: readonly Priority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];
const STATUSES: readonly Status[] = ["TODO", "IN_PROGRESS", "DONE", "CANCELLED"];
const DEFAULT_PRIORITY: Priority = "MEDIUM";
const DEFAULT_STATUS: Status = "TODO";

/**
 * Prompt système STRICT : force une sortie JSON pure (aucun markdown, aucun
 * préambule) conforme au schéma Task du backend.
 */
const SYSTEM_PROMPT = [
  "Tu génères des tâches de gestion de projet.",
  "Réponds UNIQUEMENT en JSON valide, sans markdown, sans préambule, sans texte autour :",
  "un tableau d'objets {title, description, priority, status, dueDate?}.",
  `priority ∈ {${PRIORITIES.join(", ")}}.`,
  `status ∈ {${STATUSES.join(", ")}}.`,
  "dueDate au format ISO 8601 (ex. 2026-01-31T00:00:00.000Z) ou absent.",
  "title est obligatoire et non vide. description est une phrase courte.",
  "N'invente pas de tâches déjà présentes dans le contexte fourni.",
].join(" ");

/**
 * ÉTAPE 4 — GÉNÉRATION + FORMATAGE.
 *
 * Appelle le LLM Mistral (via `Settings.llm`, configuré par buildIndex) avec le
 * contexte RAG condensé + la demande utilisateur, puis parse/valide la sortie
 * en `ProposedTask[]` prêt à sauvegarder. Rejette les tâches invalides plutôt
 * que de propager du contenu cassé.
 */
export async function generateProposedTasks(
  ragContext: string,
  userPrompt: string,
): Promise<ProposedTask[]> {
  const userMessage = [
    ragContext ? `Contexte du projet (RAG) :\n${ragContext}` : "Aucun contexte projet disponible.",
    "",
    `Demande de l'utilisateur : ${userPrompt}`,
    "",
    "Génère les tâches correspondantes en respectant STRICTEMENT le format JSON demandé.",
  ].join("\n");

  const response = await Settings.llm.chat({
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userMessage },
    ],
  });

  const raw = messageContentToString(response.message.content);
  const parsed = parseJsonArray(raw);
  return parsed.map(validateTask).filter((t): t is ProposedTask => t !== null);
}

/** Extrait le texte d'un `MessageContent` (string ou tableau de détails). */
function messageContentToString(content: MessageContent): string {
  if (typeof content === "string") return content;
  return content
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("")
    .trim();
}

/**
 * Parse une sortie LLM en tableau JSON, en tolérant :
 * - les fences ```json … ``` que le modèle ajoute parfois malgré la consigne,
 * - un objet enveloppe { tasks: [...] } au lieu d'un tableau nu.
 * Lève AiBadOutputError si rien d'exploitable (→ 502 AI_BAD_OUTPUT).
 */
function parseJsonArray(raw: string): unknown[] {
  let text = raw.trim();

  // Retire un éventuel bloc de code markdown ```json … ``` ou ``` … ```.
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced) text = fenced[1].trim();

  // Filet de sécurité : isole le premier tableau JSON si du texte subsiste autour.
  if (!text.startsWith("[") && !text.startsWith("{")) {
    const start = text.indexOf("[");
    const end = text.lastIndexOf("]");
    if (start !== -1 && end > start) text = text.slice(start, end + 1);
  }

  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new AiBadOutputError("La sortie du LLM n'est pas du JSON valide.");
  }

  if (Array.isArray(value)) return value;

  // Enveloppe tolérée : { tasks: [...] }.
  if (value && typeof value === "object" && Array.isArray((value as { tasks?: unknown }).tasks)) {
    return (value as { tasks: unknown[] }).tasks;
  }

  throw new AiBadOutputError("La sortie du LLM n'est pas un tableau de tâches.");
}

/**
 * Valide/normalise une tâche brute :
 * - title non vide → sinon tâche rejetée (null),
 * - priority/status hors enum → valeur par défaut,
 * - dueDate non parseable → omise.
 */
function validateTask(input: unknown): ProposedTask | null {
  if (!input || typeof input !== "object") return null;
  const obj = input as Record<string, unknown>;

  const title = typeof obj.title === "string" ? obj.title.trim() : "";
  if (title === "") return null;

  const description = typeof obj.description === "string" ? obj.description.trim() : "";

  const priority =
    typeof obj.priority === "string" && (PRIORITIES as readonly string[]).includes(obj.priority)
      ? (obj.priority as Priority)
      : DEFAULT_PRIORITY;

  const status =
    typeof obj.status === "string" && (STATUSES as readonly string[]).includes(obj.status)
      ? (obj.status as Status)
      : DEFAULT_STATUS;

  const task: ProposedTask = { title, description, priority, status };

  if (typeof obj.dueDate === "string" && obj.dueDate.trim() !== "") {
    const ts = Date.parse(obj.dueDate);
    if (!Number.isNaN(ts)) {
      task.dueDate = new Date(ts).toISOString();
    }
  }

  return task;
}
