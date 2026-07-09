"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";

/**
 * Providers globaux montés dans le root layout :
 *  - QueryClientProvider (TanStack Query) : cache + états loading/error.
 *  - <Toaster> (sonner) : notifications non bloquantes.
 *
 * Le QueryClient est créé via useState pour garantir une instance stable
 * par rendu client (évite le partage entre requêtes côté serveur).
 */
export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster position="top-right" richColors closeButton />
    </QueryClientProvider>
  );
}
