import { redirect } from "next/navigation";

/** Racine : redirige vers le tableau de bord (l'accès est gardé par le proxy). */
export default function HomePage() {
  redirect("/dashboard");
}
