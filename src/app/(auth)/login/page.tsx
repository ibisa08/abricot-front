import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";
import { Logo } from "@/components/layout/Logo";

export const metadata: Metadata = { title: "Connexion — Abricot" };

export default function LoginPage() {
  return (
    <main>
      <AuthShell
        imageSrc="/login-visual.jpg"
        imageAlt="Bureau lumineux : clavier, carnet à spirale, stylo, réglet et pinces à dessin sur un plan de travail clair aux accents orange."
      >
        <Link href="/dashboard" aria-label="Abricot — accueil" className="inline-flex rounded-md">
          <Logo tone="primary" height={30} />
        </Link>

        <LoginForm />

        <p className="w-full max-w-sm text-sm text-text-muted">
          Pas encore de compte&nbsp;?{" "}
          <Link
            href="/signin"
            className="rounded font-medium text-primary hover:text-primary-hover hover:underline"
          >
            Créer un compte
          </Link>
        </p>
      </AuthShell>
    </main>
  );
}
