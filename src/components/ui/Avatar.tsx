import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/format";

export type AvatarSize = "sm" | "md" | "lg";

const SIZE_CLASSES: Record<AvatarSize, string> = {
  sm: "h-7 w-7 text-[11px]",
  md: "h-9 w-9 text-xs",
  lg: "h-11 w-11 text-sm",
};

export interface AvatarProps {
  /** Nom complet (ou email) — sert aux initiales et à l'`aria-label`. */
  name: string | null | undefined;
  size?: AvatarSize;
  /**
   * Avatar de l'utilisateur courant dans la navbar → fond plein orange.
   * Sinon fond orange clair + initiales orange (DESIGN.md §2).
   */
  filled?: boolean;
  className?: string;
}

/** Avatar circulaire à initiales, accessible (aria-label = nom complet). */
export function Avatar({ name, size = "md", filled = false, className }: AvatarProps) {
  const label = name?.trim() || "Utilisateur";
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-medium",
        filled ? "bg-primary text-white" : "bg-primary-soft text-primary",
        SIZE_CLASSES[size],
        className,
      )}
    >
      {getInitials(name)}
    </span>
  );
}

export interface AvatarGroupProps {
  /** Noms des membres (ordre d'affichage). */
  names: (string | null | undefined)[];
  /** Nombre max d'avatars visibles avant le compteur « +N ». */
  max?: number;
  size?: AvatarSize;
  className?: string;
}

/** Groupe d'avatars superposés avec compteur de dépassement. */
export function AvatarGroup({ names, max = 4, size = "sm", className }: AvatarGroupProps) {
  const visible = names.slice(0, max);
  const overflow = names.length - visible.length;

  return (
    <div className={cn("flex items-center", className)}>
      {visible.map((name, index) => (
        <Avatar
          key={`${name ?? "user"}-${index}`}
          name={name}
          size={size}
          className="-ml-1.5 ring-2 ring-surface first:ml-0"
        />
      ))}
      {overflow > 0 && (
        <span
          className={cn(
            "-ml-1.5 inline-flex items-center justify-center rounded-full bg-border font-medium text-text-muted ring-2 ring-surface",
            SIZE_CLASSES[size],
          )}
          aria-label={`${overflow} membre(s) supplémentaire(s)`}
        >
          +{overflow}
        </span>
      )}
    </div>
  );
}
