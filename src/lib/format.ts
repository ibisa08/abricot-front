/**
 * Helpers de formatage partagés (noms, initiales, dates…).
 */
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

/**
 * Formate une échéance ISO en date courte française : « 9 mars ».
 * Renvoie `null` si la date est absente ou invalide (le champ méta est alors masqué).
 */
export function formatDueDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const date = parseISO(iso);
  if (Number.isNaN(date.getTime())) return null;
  return format(date, "d MMMM", { locale: fr });
}

/**
 * Initiales (2 lettres max) à partir d'un nom complet ou d'un email.
 * "Alice Dupont" → "AD" ; "bob@example.com" → "BO".
 */
export function getInitials(nameOrEmail: string | null | undefined): string {
  const value = (nameOrEmail ?? "").trim();
  if (!value) return "?";

  // Cas email : on prend les 2 premières lettres avant le "@".
  if (value.includes("@") && !value.includes(" ")) {
    return value.slice(0, 2).toUpperCase();
  }

  const parts = value.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Sépare un `name` back (« Prénom Nom ») en { firstName, lastName }.
 * 1er mot = prénom, le reste = nom (cf. docs/BACKEND_API.md « Mon compte »).
 */
export function splitName(name: string | null | undefined): {
  firstName: string;
  lastName: string;
} {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  const [firstName, ...rest] = parts;
  return { firstName, lastName: rest.join(" ") };
}
