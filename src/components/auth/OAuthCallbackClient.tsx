"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { LoaderCircle } from "lucide-react";
import { exchangeOAuthCode } from "@/lib/api";
import { queryKeys } from "@/lib/queries";

/**
 * Consomme le code à usage unique déposé par le backend sur /auth/callback.
 *
 * L'échange part vers le BFF, qui pose le cookie httpOnly : le JWT ne transite
 * jamais par le JavaScript du navigateur. Le code n'étant valable que 60 s et
 * une seule fois, l'appel est déclenché immédiatement au montage.
 */
export function OAuthCallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  // Le code est à usage unique : ce garde-fou empêche le double appel
  // provoqué par le double montage des effets en mode strict (développement).
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const code = searchParams.get("code");

    if (!code) {
      router.replace("/login?error=oauth_failed");
      return;
    }

    void (async () => {
      try {
        await exchangeOAuthCode(code);
        await queryClient.invalidateQueries({ queryKey: queryKeys.currentUser });
        toast.success("Connexion réussie.");
        router.replace("/dashboard");
        router.refresh();
      } catch {
        router.replace("/login?error=oauth_failed");
      }
    })();
  }, [router, searchParams, queryClient]);

  return (
    <div
      className="flex flex-col items-center gap-4 text-center"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <LoaderCircle className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
      <p className="text-sm font-medium text-text">Connexion en cours…</p>
      <p className="text-sm text-text-muted">
        Nous finalisons votre connexion avec Google. Merci de patienter quelques instants.
      </p>
    </div>
  );
}
