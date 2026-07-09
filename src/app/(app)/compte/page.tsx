import type { Metadata } from "next";

export const metadata: Metadata = { title: "Mon compte — Abricot" };

/** Placeholder — la page compte sera construite à l'étape suivante. */
export default function ComptePage() {
  return (
    <section>
      <h1 className="text-2xl font-semibold text-text">Mon compte</h1>
      <p className="mt-2 text-text-muted">Page en cours de construction.</p>
    </section>
  );
}
