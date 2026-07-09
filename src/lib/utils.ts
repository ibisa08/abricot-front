import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Fusionne des classes Tailwind de façon sûre :
 * clsx gère les conditions, tailwind-merge dédoublonne les utilitaires en conflit.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
