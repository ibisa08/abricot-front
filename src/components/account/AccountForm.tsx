"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { LoaderCircle } from "lucide-react";
import { api, ApiError, toUserMessage } from "@/lib/api";
import { useCurrentUser, queryKeys } from "@/lib/queries";
import { splitName } from "@/lib/format";
import {
  profileSchema,
  type ProfileValues,
  passwordChangeSchema,
  type PasswordChangeValues,
  PASSWORD_RULE_HINT,
} from "@/lib/validation";
import type { User } from "@/types";
import { Card } from "@/components/ui/Card";
import { TextField } from "@/components/ui/TextField";
import { Button } from "@/components/ui/Button";

const PROFILE_FORM_ID = "account-profile-form";

/** Page « Mon compte » : édition du profil (Nom/Prénom/Email) + mot de passe. */
export function AccountForm() {
  const queryClient = useQueryClient();
  const { data: user, isLoading, isError } = useCurrentUser();

  if (isLoading) {
    return <AccountSkeleton />;
  }

  if (isError || !user) {
    return (
      <Card className="p-6 sm:p-8">
        <h1 className="font-heading text-xl font-semibold text-text">Mon compte</h1>
        <p role="alert" className="mt-2 text-sm text-status-todo-fg">
          Impossible de charger votre profil. Réessayez plus tard.
        </p>
      </Card>
    );
  }

  return <AccountFormReady user={user} queryClient={queryClient} />;
}

/* ------------------------------------------------------------------ */
/* Formulaire monté une fois le profil chargé                          */
/* ------------------------------------------------------------------ */

function AccountFormReady({
  user,
  queryClient,
}: {
  user: User;
  queryClient: ReturnType<typeof useQueryClient>;
}) {
  const { firstName, lastName } = splitName(user.name);
  const displayName = user.name?.trim() || user.email;

  /* ---- Profil ---- */
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    setError: setProfileError,
    formState: { errors: profileErrors },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    // `values` garde le formulaire synchronisé avec le profil serveur.
    values: { firstName, lastName, email: user.email },
  });

  const profileMutation = useMutation({
    mutationFn: (body: { name: string; email: string }) =>
      api.put<{ user: User }>("/auth/profile", body),
    onSuccess: ({ user: updated }) => {
      queryClient.setQueryData(queryKeys.currentUser, updated);
      void queryClient.invalidateQueries({ queryKey: queryKeys.currentUser });
      toast.success("Informations mises à jour.");
    },
  });

  async function onProfileSubmit(values: ProfileValues) {
    // Le back n'a qu'un champ `name` : on recompose « Prénom Nom ».
    const name = `${values.firstName} ${values.lastName}`.trim();
    try {
      await profileMutation.mutateAsync({ name, email: values.email });
    } catch (err) {
      const message = toUserMessage(err);
      if (err instanceof ApiError && err.errors) {
        for (const { field, message: fieldMessage } of err.errors) {
          if (field === "email") setProfileError("email", { message: fieldMessage });
          if (field === "name") setProfileError("firstName", { message: fieldMessage });
        }
      }
      toast.error(message);
    }
  }

  return (
    <Card className="p-6 sm:p-8">
      <header>
        <h1 className="font-heading text-xl font-semibold text-text">Mon compte</h1>
        <p className="mt-1 text-sm text-text-muted">{displayName}</p>
      </header>

      <div className="mt-6 space-y-6">
        {/* Profil — le bouton de soumission (en bas) est relié via `form=`. */}
        <form
          id={PROFILE_FORM_ID}
          onSubmit={handleProfileSubmit(onProfileSubmit)}
          noValidate
          className="space-y-5"
        >
          <TextField
            label="Nom"
            autoComplete="family-name"
            placeholder="Dupont"
            error={profileErrors.lastName?.message}
            {...registerProfile("lastName")}
          />
          <TextField
            label="Prénom"
            autoComplete="given-name"
            placeholder="Amélie"
            error={profileErrors.firstName?.message}
            {...registerProfile("firstName")}
          />
          <TextField
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="a.dupont@mail.com"
            error={profileErrors.email?.message}
            {...registerProfile("email")}
          />
        </form>

        {/* Mot de passe (formulaire indépendant) */}
        <PasswordSection />

        <Button
          type="submit"
          form={PROFILE_FORM_ID}
          variant="ink"
          disabled={profileMutation.isPending}
        >
          {profileMutation.isPending ? (
            <>
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
              Enregistrement…
            </>
          ) : (
            "Modifier les informations"
          )}
        </Button>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Section mot de passe : affichage masqué → 2 champs à la demande     */
/* ------------------------------------------------------------------ */

function PasswordSection() {
  const [editing, setEditing] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<PasswordChangeValues>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: { currentPassword: "", newPassword: "" },
  });

  const passwordMutation = useMutation({
    mutationFn: (body: PasswordChangeValues) => api.put("/auth/password", body),
    onSuccess: () => {
      toast.success("Mot de passe mis à jour.");
      reset();
      setEditing(false);
    },
  });

  async function onSubmit(values: PasswordChangeValues) {
    try {
      await passwordMutation.mutateAsync(values);
    } catch (err) {
      const message = toUserMessage(err);
      if (err instanceof ApiError) {
        if (err.code === "INVALID_CURRENT_PASSWORD") {
          setError("currentPassword", { message });
        }
        if (err.errors) {
          for (const { field, message: fieldMessage } of err.errors) {
            if (field === "currentPassword" || field === "newPassword") {
              setError(field, { message: fieldMessage });
            }
          }
        }
      }
      toast.error(message);
    }
  }

  function cancel() {
    reset();
    setEditing(false);
  }

  if (!editing) {
    return (
      <div>
        <TextField
          label="Mot de passe"
          type="password"
          value="••••••••••••"
          readOnly
          disabled
          autoComplete="off"
          aria-label="Mot de passe masqué"
        />
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="mt-2 rounded text-sm font-medium text-primary hover:text-primary-hover hover:underline"
        >
          Changer le mot de passe
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <TextField
        label="Mot de passe actuel"
        type="password"
        autoComplete="current-password"
        error={errors.currentPassword?.message}
        {...register("currentPassword")}
      />
      <TextField
        label="Nouveau mot de passe"
        type="password"
        autoComplete="new-password"
        hint={PASSWORD_RULE_HINT}
        error={errors.newPassword?.message}
        {...register("newPassword")}
      />
      <div className="flex items-center gap-3">
        <Button type="submit" variant="ink" size="sm" disabled={passwordMutation.isPending}>
          {passwordMutation.isPending ? (
            <>
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
              Enregistrement…
            </>
          ) : (
            "Enregistrer le mot de passe"
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={cancel}
          disabled={passwordMutation.isPending}
        >
          Annuler
        </Button>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Skeleton de chargement                                              */
/* ------------------------------------------------------------------ */

function AccountSkeleton() {
  return (
    <Card className="p-6 sm:p-8" aria-busy="true" aria-live="polite">
      <span className="sr-only">Chargement du profil…</span>
      <div className="h-6 w-40 animate-pulse rounded bg-border" />
      <div className="mt-2 h-4 w-32 animate-pulse rounded bg-border" />
      <div className="mt-6 space-y-6">
        {[0, 1, 2, 3].map((i) => (
          <div key={i}>
            <div className="mb-2 h-4 w-24 animate-pulse rounded bg-border" />
            <div className="h-11 w-full animate-pulse rounded-lg bg-border" />
          </div>
        ))}
        <div className="h-11 w-52 animate-pulse rounded-lg bg-border" />
      </div>
    </Card>
  );
}
