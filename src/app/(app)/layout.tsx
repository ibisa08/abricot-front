import type { ReactNode } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

/**
 * Layout des pages connectées : Navbar + contenu + Footer.
 * La protection d'accès est assurée en amont par `src/proxy.ts`.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">{children}</main>
      <Footer />
    </>
  );
}
