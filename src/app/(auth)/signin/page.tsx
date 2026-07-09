import type { Metadata } from "next";

export const metadata: Metadata = { title: "Inscription — Abricot" };

/** Placeholder — le formulaire d'inscription sera construit à l'étape suivante. */
export default function SigninPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="text-center">
        <h1 className="font-heading text-3xl font-bold text-primary">Inscription</h1>
        <p className="mt-2 text-text-muted">Page en cours de construction.</p>
      </div>
    </main>
  );
}
