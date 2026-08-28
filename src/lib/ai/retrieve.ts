import { MetadataMode, type VectorStoreIndex } from "llamaindex";

/** Nombre de passages de contexte à ramener (petit index → top-k modeste). */
const SIMILARITY_TOP_K = 5;

/**
 * ÉTAPE 3 — RETRIEVAL (RAG).
 *
 * Interroge l'index vectoriel avec le `prompt` utilisateur et renvoie un
 * contexte condensé (string) à injecter dans le prompt de génération.
 *
 * Objectif : donner au LLM les tâches/infos les plus proches de la demande pour
 * (1) rester cohérent avec le projet et (2) éviter de reproposer des tâches qui
 * existent déjà.
 */
export async function retrieveContext(index: VectorStoreIndex, prompt: string): Promise<string> {
  const retriever = index.asRetriever({ similarityTopK: SIMILARITY_TOP_K });
  const nodes = await retriever.retrieve(prompt);

  const passages = nodes
    .map((n) => n.node.getContent(MetadataMode.NONE).trim())
    .filter((text) => text !== "");

  // Dédoublonnage défensif (le même passage peut ressortir plusieurs fois).
  const unique = Array.from(new Set(passages));

  return unique.join("\n\n---\n\n");
}
