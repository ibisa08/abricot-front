import { GOOGLE_AUTH_URL } from "@/lib/oauth";
import { buttonClasses } from "@/components/ui/Button";

/**
 * Logo Google officiel (marque déposée).
 * lucide-react n'expose aucune icône de marque : ce SVG est donc inline.
 * `aria-hidden` car le libellé du lien porte déjà l'information.
 */
function GoogleMark() {
  return (
    <svg viewBox="0 0 18 18" className="h-[18px] w-[18px]" aria-hidden="true" focusable="false">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72a5.41 5.41 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
      />
    </svg>
  );
}

export interface GoogleAuthSectionProps {
  /**
   * Libellé accessible complet du lien, adapté à la page.
   * Le texte visible reste « Continuer avec Google ».
   */
  ariaLabel: string;
}

/**
 * Séparateur « ou » suivi du bouton de connexion Google.
 *
 * C'est un `<a>` et non un `<button>` : le flux exige une navigation pleine
 * page vers le backend, qui redirige ensuite vers Google. Un `fetch` ne
 * suivrait pas cette redirection.
 */
export function GoogleAuthSection({ ariaLabel }: GoogleAuthSectionProps) {
  return (
    <div className="mt-6 w-full max-w-sm">
      {/* Séparateur décoratif : les trois éléments sont masqués aux lecteurs
          d'écran, le lien qui suit se suffit à lui-même. */}
      <div className="flex items-center gap-4" aria-hidden="true">
        <span className="h-px flex-1 bg-border" />
        <span className="text-sm text-text-muted">ou</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <a
        href={GOOGLE_AUTH_URL}
        aria-label={ariaLabel}
        className={buttonClasses({
          variant: "ghost",
          className: "mt-6 w-full border border-border bg-surface hover:bg-surface-alt",
        })}
      >
        <GoogleMark />
        Continuer avec Google
      </a>
    </div>
  );
}
