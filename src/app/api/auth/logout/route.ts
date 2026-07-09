import { NextResponse } from "next/server";
import { AUTH_COOKIE } from "@/lib/auth";

/**
 * POST /api/auth/logout
 * Supprime le cookie httpOnly `abricot_token`. Le back étant sans état (JWT),
 * il suffit d'effacer le cookie côté BFF.
 */
export async function POST() {
  const response = NextResponse.json({ success: true, message: "Déconnecté." });
  // Suppression du cookie : même nom + path, valeur vide et maxAge 0.
  response.cookies.set(AUTH_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
