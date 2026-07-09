import { cn } from "@/lib/utils";

export interface LogoProps {
  /** Couleur du logo : orange (navbar) ou encre (footer). */
  tone?: "primary" | "ink";
  className?: string;
}

/**
 * Logo texte « ABRIC🍑T » stylisé. Le « O » central est remplacé par un
 * pictogramme d'abricot. Décoratif : le nom est porté par le lien parent.
 */
export function Logo({ tone = "primary", className }: LogoProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center font-heading text-xl font-bold tracking-tight",
        tone === "primary" ? "text-primary" : "text-ink",
        className,
      )}
    >
      ABRIC
      <span aria-hidden="true" className="mx-[1px] text-[0.9em] leading-none">
        🍑
      </span>
      T
    </span>
  );
}
