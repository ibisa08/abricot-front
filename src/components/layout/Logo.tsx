import { cn } from "@/lib/utils";

/** Ratio intrinsèque du wordmark (viewBox 253×33). */
const LOGO_RATIO = 253 / 33;

export interface LogoProps {
  /** Couleur du logo : orange (navbar/auth) ou encre (footer). */
  tone?: "primary" | "ink";
  /** Hauteur en pixels ; la largeur suit le ratio du wordmark. */
  height?: number;
  className?: string;
}

/**
 * Logo « ABRIC🍑T » officiel. On charge le SVG fourni (`/logo-abricot.svg`)
 * comme masque CSS : la teinte est pilotée par `background-color`, ce qui permet
 * une version orange (marque) et une version encre (footer) depuis un seul asset.
 * Décoratif : le nom accessible est porté par le lien/texte parent.
 */
export function Logo({ tone = "primary", height = 24, className }: LogoProps) {
  return (
    <span
      aria-hidden="true"
      className={cn("inline-block shrink-0", tone === "primary" ? "bg-primary" : "bg-ink", className)}
      style={{
        height,
        width: height * LOGO_RATIO,
        maskImage: "url(/logo-abricot.svg)",
        WebkitMaskImage: "url(/logo-abricot.svg)",
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
        maskSize: "contain",
        WebkitMaskSize: "contain",
        maskPosition: "left center",
        WebkitMaskPosition: "left center",
      }}
    />
  );
}
