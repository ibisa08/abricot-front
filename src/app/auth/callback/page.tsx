import type { Metadata } from "next";
import { Suspense } from "react";
import { LoaderCircle } from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { OAuthCallbackClient } from "@/components/auth/OAuthCallbackClient";

export const metadata: Metadata = {
  title: "Connexion en cours — Abricot",
  robots: { index: false, follow: false },
};

/**
 * Page de retour du flux Google.
 *
 * Le backend redirige ici avec `?code=<code à usage unique>`. L'échange est
 * réalisé côté client vers le BFF, qui pose le cookie httpOnly, puis
 * l'utilisateur est envoyé sur /dashboard. Tout échec renvoie vers
 * /login?error=oauth_failed.
 */
export default function OAuthCallbackPage() {
  return (
    <main
      id="main-content"
      className="flex min-h-screen flex-col items-center justify-center gap-10 bg-bg-auth px-6 py-12"
    >
      <Logo tone="primary" height={30} />

      <Suspense
        fallback={
          <div
            className="flex flex-col items-center gap-4 text-center"
            role="status"
            aria-live="polite"
            aria-busy="true"
          >
            <LoaderCircle className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
            <p className="text-sm font-medium text-text">Connexion en cours…</p>
          </div>
        }
      >
        <OAuthCallbackClient />
      </Suspense>
    </main>
  );
}
