import type { Metadata } from "next";

export const metadata: Metadata = { title: "Projets — Abricot" };

/** Placeholder — la liste des projets sera construite à l'étape suivante. */
export default function ProjetsPage() {
  return (
    <section>
      <h1 className="text-2xl font-semibold text-text">Projets</h1>
      <p className="mt-2 text-text-muted">Page en cours de construction.</p>
    </section>
  );
}
