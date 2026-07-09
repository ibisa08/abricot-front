import type { Metadata } from "next";

export const metadata: Metadata = { title: "Projet — Abricot" };

/** Placeholder — le détail d'un projet sera construit à l'étape suivante. */
export default async function ProjetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <section>
      <h1 className="text-2xl font-semibold text-text">Projet</h1>
      <p className="mt-2 text-text-muted">
        Détail du projet <span className="font-medium text-text">{id}</span> — en cours de
        construction.
      </p>
    </section>
  );
}
