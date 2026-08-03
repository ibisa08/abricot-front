import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { SigninForm } from "@/components/auth/SigninForm";
import { GoogleAuthSection } from "@/components/auth/GoogleAuthSection";
import { Logo } from "@/components/layout/Logo";

export const metadata: Metadata = { title: "Inscription — Abricot" };

export default function SigninPage() {
  return (
    <main id="main-content">
      <AuthShell
        imageSrc="/signin-visual.webp"
        imageAlt="Poste de travail organisé : ordinateur portable, agrafeuse, stylos orange, réglet et carnet sur un plan clair aux accents bleus et orange."
      >
        <Link href="/dashboard" aria-label="Abricot — accueil" className="inline-flex rounded-md">
          <Logo tone="primary" height={30} />
        </Link>

        {/* Bloc central d'AuthShell : formulaire puis Google. */}
        <div className="w-full">
          <SigninForm />

          <GoogleAuthSection ariaLabel="Créer un compte avec Google" />
        </div>

        <p className="w-full max-w-sm text-sm text-text-muted">
          Déjà inscrit&nbsp;?{" "}
          <Link
            href="/login"
            className="rounded font-medium text-primary-text hover:text-primary-hover hover:underline"
          >
            Se connecter
          </Link>
        </p>
      </AuthShell>
    </main>
  );
}
