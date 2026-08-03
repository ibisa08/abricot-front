import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";
import { GoogleAuthSection } from "@/components/auth/GoogleAuthSection";
import { OAuthErrorAlert } from "@/components/auth/OAuthErrorAlert";
import { Logo } from "@/components/layout/Logo";

export const metadata: Metadata = { title: "Connexion — Abricot" };

export default function LoginPage() {
  return (
    <main id="main-content">
      <AuthShell
        imageSrc="/login-visual.webp"
        imageAlt="Bureau lumineux : clavier, carnet à spirale, stylo, réglet et pinces à dessin sur un plan de travail clair aux accents orange."
      >
        <Link href="/dashboard" aria-label="Abricot — accueil" className="inline-flex rounded-md">
          <Logo tone="primary" height={30} />
        </Link>

        {/* Bloc central d'AuthShell : erreur OAuth, formulaire, puis Google. */}
        <div className="w-full">
          <Suspense fallback={null}>
            <OAuthErrorAlert />
          </Suspense>

          <LoginForm />

          <GoogleAuthSection ariaLabel="Se connecter avec Google" />
        </div>

        <p className="w-full max-w-sm text-sm text-text-muted">
          Pas encore de compte&nbsp;?{" "}
          <Link
            href="/signin"
            className="rounded font-medium text-primary-text hover:text-primary-hover hover:underline"
          >
            Créer un compte
          </Link>
        </p>
      </AuthShell>
    </main>
  );
}
