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

/* ------------------------------------------------------------------ */
/* Projet (création / édition)                                        */
/* ------------------------------------------------------------------ */

export const projectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Le titre doit faire au moins 2 caractères.")
    .max(100, "Le titre ne peut pas dépasser 100 caractères."),
  description: z
    .string()
    .trim()
    .min(1, "La description est requise.")
    .max(500, "La description ne peut pas dépasser 500 caractères."),
});
export type ProjectValues = z.infer<typeof projectSchema>;

/* ------------------------------------------------------------------ */
/* Changement de mot de passe                                         */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/* Tâche (création / édition)                                         */
/* ------------------------------------------------------------------ */

export const taskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Le titre doit faire au moins 2 caractères.")
    .max(200, "Le titre ne peut pas dépasser 200 caractères."),
  description: z
    .string()
    .trim()
    .min(1, "La description est requise.")
    .max(1000, "La description ne peut pas dépasser 1000 caractères."),
  // `<input type="date">` renvoie "yyyy-mm-dd" ; requis côté front.
  dueDate: z.string().min(1, "L'échéance est requise."),
});
export type TaskValues = z.infer<typeof taskSchema>;

/** Contenu de commentaire (1–2000 caractères, cf. BACKEND_API.md). */
export const commentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Le commentaire ne peut pas être vide.")
    .max(2000, "Le commentaire ne peut pas dépasser 2000 caractères."),
});
export type CommentValues = z.infer<typeof commentSchema>;

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
