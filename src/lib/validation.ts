/**
 * Schémas de validation zod — dupliquent les règles du back pour un feedback
 * immédiat côté client (docs/BACKEND_API.md). Le back reste l'autorité finale.
 */
import { z } from "zod";

/**
 * Règle mot de passe du back (register + change password) :
 * min 8, 1 minuscule, 1 majuscule, 1 chiffre, 1 spécial parmi @$!%*?&.
 * Regex identique à celle du back.
 */
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

/** Message d'aide affiché sous les champs de nouveau mot de passe. */
export const PASSWORD_RULE_HINT =
  "8 caractères minimum, avec au moins une majuscule, une minuscule, un chiffre et un caractère spécial (@$!%*?&).";

/** Email non vide + format valide. */
const emailSchema = z
  .string()
  .trim()
  .min(1, "L'email est requis.")
  .pipe(z.email("Format d'email invalide."));

/** Mot de passe fort (règle back). */
const strongPasswordSchema = z.string().regex(PASSWORD_REGEX, PASSWORD_RULE_HINT);

/* ------------------------------------------------------------------ */
/* Connexion                                                          */
/* ------------------------------------------------------------------ */

export const loginSchema = z.object({
  email: emailSchema,
  // À la connexion, on n'impose pas la règle complète : juste « requis ».
  password: z.string().min(1, "Le mot de passe est requis."),
});
export type LoginValues = z.infer<typeof loginSchema>;

/* ------------------------------------------------------------------ */
/* Inscription                                                        */
/* ------------------------------------------------------------------ */

export const registerSchema = z.object({
  email: emailSchema,
  password: strongPasswordSchema,
});
export type RegisterValues = z.infer<typeof registerSchema>;

/* ------------------------------------------------------------------ */
/* Profil (Mon compte)                                                */
/* ------------------------------------------------------------------ */

/**
 * Le back n'a qu'un champ `name`. On saisit Prénom + Nom séparément puis on
 * recompose `name = "${prenom} ${nom}".trim()` à l'enregistrement.
 * `name` doit faire ≥ 2 caractères côté back → on l'assure ici.
 */
export const profileSchema = z
  .object({
    firstName: z.string().trim().min(1, "Le prénom est requis."),
    lastName: z.string().trim(),
    email: emailSchema,
  })
  .refine((v) => `${v.firstName} ${v.lastName}`.trim().length >= 2, {
    message: "Le nom complet doit faire au moins 2 caractères.",
    path: ["firstName"],
  });
export type ProfileValues = z.infer<typeof profileSchema>;

/* ------------------------------------------------------------------ */
/* Changement de mot de passe                                         */
/* ------------------------------------------------------------------ */

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Le mot de passe actuel est requis."),
    newPassword: strongPasswordSchema,
  })
  .refine((v) => v.currentPassword !== v.newPassword, {
    message: "Le nouveau mot de passe doit être différent de l'actuel.",
    path: ["newPassword"],
  });
export type PasswordChangeValues = z.infer<typeof passwordChangeSchema>;
