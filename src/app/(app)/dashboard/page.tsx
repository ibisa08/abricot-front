import type { Metadata } from "next";

export const metadata: Metadata = { title: "Tableau de bord — Abricot" };

/** Placeholder — la vue métier sera construite à l'étape suivante. */
export default function DashboardPage() {
  return (
    <section>
      <h1 className="text-2xl font-semibold text-text">Tableau de bord</h1>
      <p className="mt-2 text-text-muted">Page en cours de construction.</p>
    </section>
  );
}
