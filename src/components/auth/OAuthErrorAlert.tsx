"use client";

import { useSearchParams } from "next/navigation";
import { getOAuthErrorMessage } from "@/lib/oauth";
import { Alert } from "@/components/ui/Alert";

/**
 * Affiche le message correspondant au paramètre `?error=` posé par le backend
 * lorsqu'un flux Google échoue. Ne rend rien en l'absence d'erreur.
 *
 * À monter sous une frontière <Suspense> : `useSearchParams` bascule sinon
 * toute la page en rendu client au build.
 */
export function OAuthErrorAlert() {
  const searchParams = useSearchParams();
  const message = getOAuthErrorMessage(searchParams.get("error"));

  if (!message) return null;

  return (
    <Alert className="mb-6 w-full max-w-sm">
      <span className="sr-only">Erreur&nbsp;: </span>
      {message}
    </Alert>
  );
}
