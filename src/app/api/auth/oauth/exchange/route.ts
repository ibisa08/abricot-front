import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, authCookieOptions, BACKEND_URL } from "@/lib/auth";
import type { ApiResponse, User } from "@/types";

/**
 * POST /api/auth/oauth/exchange
 *
 * Relaie vers Express /auth/oauth/exchange le code à usage unique reçu sur
 * /auth/callback, récupère { user, token }, pose le cookie httpOnly
 * `abricot_token` et renvoie { user } SANS le token.
 *
 * Même contrat que /api/auth/login : le JWT ne traverse jamais le navigateur.
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Corps de requête invalide." },
      { status: 400 },
    );
  }

  let backendRes: Response;
  try {
    backendRes = await fetch(`${BACKEND_URL}/auth/oauth/exchange`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Le serveur est momentanément injoignable." },
      { status: 502 },
    );
  }

  const payload = (await backendRes.json()) as ApiResponse<{ user: User; token: string }>;

  // Code invalide, expiré ou déjà utilisé → relayer tel quel, sans cookie.
  if (!backendRes.ok || !payload.success || !payload.data?.token) {
    return NextResponse.json(payload, { status: backendRes.status });
  }

  const { user, token } = payload.data;

  const response = NextResponse.json(
    { success: true, message: payload.message, data: { user } },
    { status: 200 },
  );
  response.cookies.set(AUTH_COOKIE, token, authCookieOptions);
  return response;
}
