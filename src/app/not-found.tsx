import Link from "next/link";
import { Logo } from "@/components/layout/Logo";

/** Page 404 sobre (exigée par l'auto-éval), dans l'esprit Abricot. */
export default function NotFound() {
  return (
    <main
      id="main-content"
      className="flex flex-1 flex-col items-center justify-center px-4 py-20 text-center"
    >
      <Logo tone="primary" height={28} />
      <p className="mt-8 font-heading text-6xl font-bold text-text">404</p>
      <h1 className="mt-2 font-heading text-xl font-semibold text-text">Page introuvable</h1>
      <p className="mt-2 max-w-md text-text-muted">
        La page que vous cherchez n&apos;existe pas ou a été déplacée.
      </p>
      <Link
        href="/dashboard"
        className="mt-8 inline-flex h-11 items-center justify-center rounded-lg bg-ink px-5 text-sm font-medium text-white transition-colors hover:bg-ink-hover"
      >
        Retour au tableau de bord
      </Link>
    </main>
  );
}
