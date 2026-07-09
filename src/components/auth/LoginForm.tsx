"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { LoaderCircle } from "lucide-react";
import { login, ApiError, toUserMessage } from "@/lib/api";
import { loginSchema, type LoginValues } from "@/lib/validation";
import { queryKeys } from "@/lib/queries";
import { TextField } from "@/components/ui/TextField";
import { Button } from "@/components/ui/Button";

/** Formulaire de connexion (react-hook-form + zod → BFF `login()`). */
export function LoginForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginValues) {
    setFormError(null);
    try {
      await login(values);
      // Le cookie httpOnly est posé : on rafraîchit le cache utilisateur et on entre.
      await queryClient.invalidateQueries({ queryKey: queryKeys.currentUser });
      toast.success("Connexion réussie.");
      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      const message = toUserMessage(err);
      // Erreurs de validation par champ éventuelles remontées par le back.
      if (err instanceof ApiError && err.errors) {
        for (const { field, message: fieldMessage } of err.errors) {
          if (field === "email" || field === "password") {
            setError(field, { message: fieldMessage });
          }
        }
      }
      setFormError(message);
      toast.error(message);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <h1 className="font-heading text-4xl font-bold text-primary">Connexion</h1>

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
          autoComplete="current-password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register("password")}
        />

        <Button type="submit" variant="ink" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
              Connexion…
            </>
          ) : (
            "Se connecter"
          )}
        </Button>

        <div className="text-center">
          {/* Présent mais non fonctionnel (hors périmètre du back). */}
          <button
            type="button"
            onClick={() => toast.info("Réinitialisation du mot de passe : bientôt disponible.")}
            className="rounded text-sm font-medium text-primary hover:text-primary-hover hover:underline"
          >
            Mot de passe oublié&nbsp;?
          </button>
        </div>
      </form>
    </div>
  );
}
