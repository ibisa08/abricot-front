import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE } from "@/lib/auth";

/**
 * Garde de routes du BFF (middleware Next.js).
 *
 * Règles :
 *  - Route privée sans cookie      → redirect /login
 *  - /login ou /signin AVEC cookie → redirect /dashboard
 *  - /login, /signin et /api/*     restent publics.
 *
 * La vraie autorité reste le back : tout 401 renvoyé par le proxy API
 * déclenche un logout + redirect côté client.
 */

/** Routes publiques (pas de garde). */
const PUBLIC_PATHS = ["/login", "/signin"];

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const hasToken = Boolean(request.cookies.get(AUTH_COOKIE)?.value);
  const isPublic = PUBLIC_PATHS.includes(pathname);

  // Utilisateur connecté sur une page d'auth → renvoyer vers le dashboard.
  if (isPublic && hasToken) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Route privée sans cookie → renvoyer vers la connexion.
  if (!isPublic && !hasToken) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

/**
 * Le matcher exclut les assets, les fichiers statiques et l'ensemble des
 * routes /api/* (la couche BFF gère elle-même l'auth des appels serveur).
 */
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
