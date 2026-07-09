import type { ReactNode } from "react";
import Image from "next/image";

export interface AuthShellProps {
  /** Photo d'ambiance affichée en pleine hauteur sur la colonne droite. */
  imageSrc: string;
  /** Texte alternatif descriptif de la photo (image signifiante → alt requis). */
  imageAlt: string;
  /**
   * Contenu de la colonne gauche. Passer 3 blocs directs (logo, formulaire,
   * pied de page) : ils sont répartis haut / centre / bas via `justify-between`.
   */
  children: ReactNode;
}

/**
 * Gabarit des pages d'authentification (Log In / Sign In) :
 * colonne gauche = formulaire, colonne droite = photo plein cadre.
 * Sur mobile, la photo est masquée et le formulaire occupe tout l'écran.
 */
export function AuthShell({ imageSrc, imageAlt, children }: AuthShellProps) {
  return (
    <div className="grid min-h-screen w-full lg:grid-cols-[minmax(0,46%)_1fr]">
      {/* Colonne formulaire */}
      <div className="flex min-h-screen flex-col items-start justify-between gap-10 px-6 py-8 sm:px-10 sm:py-12 lg:px-16">
        {children}
      </div>

      {/* Colonne photo (masquée sous lg) */}
      <div className="relative hidden lg:block">
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          priority
          sizes="(min-width: 1024px) 54vw, 0px"
          className="object-cover"
        />
      </div>
    </div>
  );
}
