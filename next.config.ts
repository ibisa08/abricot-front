import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Masque l'indicateur devtools Next.js (rond noir « N » en bas à gauche qui
  // se superposait au logo du footer). Absent des builds de production.
  devIndicators: false,

  // LlamaIndex.TS et le SDK Mistral s'exécutent CÔTÉ SERVEUR (pipeline RAG,
  // src/lib/ai). On les sort du bundle Next : ils embarquent des dépendances
  // Node/optionnelles que le bundler ne doit pas essayer d'empaqueter.
  serverExternalPackages: [
    "llamaindex",
    "@llamaindex/core",
    "@llamaindex/env",
    "@llamaindex/mistral",
    "@mistralai/mistralai",
  ],
};

export default nextConfig;
