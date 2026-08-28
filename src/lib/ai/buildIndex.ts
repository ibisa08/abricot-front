import { Document, Settings, VectorStoreIndex } from "llamaindex";
import { MistralAI, MistralAIEmbedding } from "@llamaindex/mistral";
import { getMistralApiKey } from "@/lib/ai/errors";
import type { ProjectContext } from "@/lib/ai/types";

/** Modèle de chat Mistral retenu pour la génération de tâches. */
const MISTRAL_CHAT_MODEL = "mistral-small-latest" as const;

let configured = false;

/**
 * Configure une fois pour toutes le `Settings` global de LlamaIndex avec le
 * client Mistral (clé lue CÔTÉ SERVEUR uniquement).
 *
 * - LLM : MistralAI (mistral-small-latest) — sert aussi à l'étape de génération
 *   via `Settings.llm`.
 * - Embeddings : MistralAIEmbedding (`mistral-embed`) — l'embedding Mistral natif
 *   exposé par LlamaIndex (aucun fallback nécessaire, il est disponible).
 *
 * Le SDK Mistral tape https://api.mistral.ai/v1 (compatible OpenAI) ; on n'a
 * donc pas à surcharger la base URL.
 */
export function configureMistral(): void {
  const apiKey = getMistralApiKey();
  if (configured) return;

  Settings.llm = new MistralAI({
    model: MISTRAL_CHAT_MODEL,
    apiKey,
    // Génération de tâches structurées : on veut peu de dérive créative.
    temperature: 0.2,
  });
  Settings.embedModel = new MistralAIEmbedding({ apiKey });
  configured = true;
}

/**
 * ÉTAPE 2 — INDEXATION (LlamaIndex.TS).
 *
 * Transforme le ProjectContext en Documents (un par tâche existante + un pour
 * la description du projet) puis construit un VectorStoreIndex EN MÉMOIRE.
 *
 * Choix « in-memory » assumé : le volume (description projet + quelques dizaines
 * de tâches au plus) ne justifie PAS une vector DB externe (pgvector, Pinecone…).
 * L'index vit le temps d'une requête, se reconstruit à chaque appel, et évite
 * toute infra/persistance à gérer. Défendable et suffisant pour ce cas d'usage.
 */
export async function buildProjectIndex(context: ProjectContext): Promise<VectorStoreIndex> {
  configureMistral();

  const documents: Document[] = [];

  // Un document pour l'identité du projet (nom + description).
  const projectText = [
    `Projet : ${context.project.name}`,
    context.project.description ? `Description : ${context.project.description}` : "",
  ]
    .filter(Boolean)
    .join("\n");
  documents.push(
    new Document({ text: projectText, metadata: { kind: "project", name: context.project.name } }),
  );

  // Un document par tâche existante (pour éviter les doublons au retrieval).
  for (const task of context.existingTasks) {
    const text = [
      `Tâche existante : ${task.title}`,
      task.description ? `Détails : ${task.description}` : "",
      `Statut : ${task.status}`,
    ]
      .filter(Boolean)
      .join("\n");
    documents.push(new Document({ text, metadata: { kind: "task", status: task.status } }));
  }

  // `fromDocuments` calcule les embeddings (mistral-embed) et bâtit l'index mémoire.
  return VectorStoreIndex.fromDocuments(documents);
}
