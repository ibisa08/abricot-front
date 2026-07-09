import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, BACKEND_URL } from "@/lib/auth";

/**
 * Proxy générique authentifié du BFF.
 *
 * Le navigateur appelle /api/backend/<path> ; ce handler :
 *  - lit le cookie httpOnly `abricot_token`,
 *  - ajoute `Authorization: Bearer <token>`,
 *  - forwarde vers `${BACKEND_URL}/<path>` en conservant querystring + body,
 *  - relaie le JSON et le status tels quels.
 *
 * Un 401 du back est relayé en 401 (le front déclenchera un logout + redirect).
 */

type RouteCtx = { params: Promise<{ path: string[] }> };

async function forward(request: NextRequest, ctx: RouteCtx): Promise<NextResponse> {
  const { path } = await ctx.params;
  const token = request.cookies.get(AUTH_COOKIE)?.value;

  // Reconstruit l'URL cible : segments + querystring d'origine.
  const search = request.nextUrl.search; // inclut le "?" ou chaîne vide
  const targetUrl = `${BACKEND_URL}/${path.join("/")}${search}`;

  // En-têtes forwardés : on repart propre et on n'ajoute que l'essentiel.
  const headers: HeadersInit = {
    Accept: "application/json",
  };
  const contentType = request.headers.get("content-type");
  if (contentType) headers["Content-Type"] = contentType;
  if (token) headers["Authorization"] = `Bearer ${token}`;

  // Corps : présent uniquement pour les méthodes qui en portent un.
  const method = request.method.toUpperCase();
  const hasBody = method !== "GET" && method !== "HEAD";
  const body = hasBody ? await request.text() : undefined;

  let backendRes: Response;
  try {
    backendRes = await fetch(targetUrl, {
      method,
      headers,
      body: body && body.length > 0 ? body : undefined,
      cache: "no-store",
    });
  } catch {
    // Back injoignable : erreur 502 exploitable côté client.
    return NextResponse.json(
      { success: false, message: "Le serveur est momentanément injoignable." },
      { status: 502 },
    );
  }

  // On relaie le corps brut + le status + le content-type d'origine.
  const responseBody = await backendRes.text();
  const resContentType = backendRes.headers.get("content-type") ?? "application/json";

  return new NextResponse(responseBody, {
    status: backendRes.status,
    headers: { "Content-Type": resContentType },
  });
}

export function GET(request: NextRequest, ctx: RouteCtx) {
  return forward(request, ctx);
}

export function POST(request: NextRequest, ctx: RouteCtx) {
  return forward(request, ctx);
}

export function PUT(request: NextRequest, ctx: RouteCtx) {
  return forward(request, ctx);
}

export function DELETE(request: NextRequest, ctx: RouteCtx) {
  return forward(request, ctx);
}
