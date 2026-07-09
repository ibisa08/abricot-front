import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, authCookieOptions, BACKEND_URL } from "@/lib/auth";
import type { ApiResponse, User } from "@/types";

/**
 * POST /api/auth/register
 * Relaie vers Express /auth/register, récupère { user, token },
 * pose le cookie httpOnly `abricot_token`, et renvoie { user } SANS le token.
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

  const backendRes = await fetch(`${BACKEND_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const payload = (await backendRes.json()) as ApiResponse<{ user: User; token: string }>;

  // Échec (ex. EMAIL_ALREADY_EXISTS / validation) → relayer tel quel, sans cookie.
  if (!backendRes.ok || !payload.success || !payload.data?.token) {
    return NextResponse.json(payload, { status: backendRes.status });
  }

  const { user, token } = payload.data;

  const response = NextResponse.json(
    { success: true, message: payload.message, data: { user } },
    { status: 201 },
  );
  response.cookies.set(AUTH_COOKIE, token, authCookieOptions);
  return response;
}
