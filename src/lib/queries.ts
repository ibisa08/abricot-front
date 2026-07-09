"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { User } from "@/types";

/** Clés de cache React Query centralisées. */
export const queryKeys = {
  currentUser: ["current-user"] as const,
};

/**
 * Récupère l'utilisateur courant via le BFF (`GET /auth/profile`).
 * Utilisé par la navbar. `retry: false` : un 401 ne doit pas être ré-essayé.
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.currentUser,
    queryFn: async () => {
      const { user } = await api.get<{ user: User }>("/auth/profile");
      return user;
    },
    retry: false,
    staleTime: 5 * 60_000,
  });
}
