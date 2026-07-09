import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { SigninForm } from "@/components/auth/SigninForm";
import { Logo } from "@/components/layout/Logo";

export const metadata: Metadata = { title: "Inscription — Abricot" };

export default function SigninPage() {
  return (
    <main id="main-content">
      <AuthShell
        imageSrc="/signin-visual.jpg"
        imageAlt="Poste de travail organisé : ordinateur portable, agrafeuse, stylos orange, réglet et carnet sur un plan clair aux accents bleus et orange."
      >
        <Link href="/dashboard" aria-label="Abricot — accueil" className="inline-flex rounded-md">
          <Logo tone="primary" height={30} />
        </Link>

        <SigninForm />

        <p className="w-full max-w-sm text-sm text-text-muted">
          Déjà inscrit&nbsp;?{" "}
          <Link
            href="/login"
            className="rounded font-medium text-primary hover:text-primary-hover hover:underline"
          >
            Se connecter
          </Link>
        </p>
      </AuthShell>
    </main>
  );
}
