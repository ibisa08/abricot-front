"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { LoaderCircle } from "lucide-react";
import { register as registerUser, ApiError, toUserMessage } from "@/lib/api";
import { registerSchema, type RegisterValues, PASSWORD_RULE_HINT } from "@/lib/validation";
import { queryKeys } from "@/lib/queries";
import { TextField } from "@/components/ui/TextField";
import { Button } from "@/components/ui/Button";

/** Formulaire d'inscription (react-hook-form + zod → BFF `register()`). */
export function SigninForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: RegisterValues) {
    setFormError(null);
    try {
      // Pas de champ « nom » ici (la maquette n'en a pas ; `name` reste optionnel côté back).
      await registerUser(values);
      await queryClient.invalidateQueries({ queryKey: queryKeys.currentUser });
      toast.success("Compte créé. Bienvenue sur Abricot !");
      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      const message = toUserMessage(err);
      if (err instanceof ApiError) {
        if (err.code === "EMAIL_ALREADY_EXISTS") {
          setError("email", { message });
        }
        if (err.errors) {
          for (const { field, message: fieldMessage } of err.errors) {
            if (field === "email" || field === "password") {
              setError(field, { message: fieldMessage });
            }
          }
        }
      }
      setFormError(message);
      toast.error(message);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <h1 className="font-heading text-4xl font-bold text-primary">Inscription</h1>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8 space-y-5">
        {formError && (
          <p
            role="alert"
            className="rounded-lg border border-status-todo-fg/30 bg-status-todo-bg/50 px-3.5 py-2.5 text-sm font-medium text-status-todo-fg"
          >
            {formError}
          </p>
        )}

        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="vous@exemple.com"
          error={errors.email?.message}
          {...register("email")}
        />

        <TextField
          label="Mot de passe"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          hint={PASSWORD_RULE_HINT}
          error={errors.password?.message}
          {...register("password")}
        />

        <Button type="submit" variant="ink" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
              Création…
            </>
          ) : (
            "S'inscrire"
          )}
        </Button>
      </form>
    </div>
  );
}
