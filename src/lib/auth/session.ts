import { SignJWT } from "jose/jwt/sign";
import { jwtVerify } from "jose/jwt/verify";
import type { Role } from "@/db/schema";

export const SESSION_COOKIE = "pa_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8h

export type SessionClaims = {
  /** id do usuário efetivo (o tenant enxergado). */
  sub: string;
  email: string;
  name: string;
  role: Role;
  /** null para super-admin fora de impersonation. */
  tenantId: string | null;
  /** Presente somente durante impersonation. */
  imp?: { userId: string; email: string; role: Role };
  jti: string;
  iat: number;
  exp: number;
};

export type SessionInput = Omit<SessionClaims, "jti" | "iat" | "exp"> & { jti?: string };

const DEV_SECRET = "dev-secret-projetoauto-nao-usar-em-producao";

function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET || (process.env.NODE_ENV !== "production" ? DEV_SECRET : "");
  if (!secret) {
    throw new Error("AUTH_SECRET não configurado nas variáveis de ambiente do Webflow Cloud.");
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(input: SessionInput): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({
    email: input.email,
    name: input.name,
    role: input.role,
    tenantId: input.tenantId,
    ...(input.imp ? { imp: input.imp } : {}),
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(input.sub)
    .setJti(input.jti ?? crypto.randomUUID())
    .setIssuedAt(now)
    .setExpirationTime(now + SESSION_TTL_SECONDS)
    .sign(getSecretKey());
}

/** Verificação puramente criptográfica — não toca no banco (usada também no middleware Edge). */
export async function verifySessionToken(token: string): Promise<SessionClaims | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), { algorithms: ["HS256"] });
    if (!payload.sub || !payload.jti || !payload.exp || !payload.iat) return null;
    return {
      sub: payload.sub,
      email: String(payload.email ?? ""),
      name: String(payload.name ?? ""),
      role: payload.role as Role,
      tenantId: (payload.tenantId as string | null) ?? null,
      imp: payload.imp as SessionClaims["imp"],
      jti: payload.jti,
      iat: payload.iat,
      exp: payload.exp,
    };
  } catch {
    return null;
  }
}

export function isImpersonating(claims: SessionClaims): boolean {
  return Boolean(claims.imp);
}

/** Para onde mandar o usuário logo após o login. */
export function defaultLandingPath(role: Role): string {
  return role === "super_admin" ? "/super-admin" : "/admin";
}
