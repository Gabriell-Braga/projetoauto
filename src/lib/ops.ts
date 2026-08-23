import { forbidden } from "@/lib/http";

/**
 * Rotas operacionais (/api/ops/*) são protegidas por um segredo configurado
 * como Secret Variable no painel do Webflow Cloud.
 */
export function assertOpsSecret(request: Request): void {
  const expected = process.env.OPS_SECRET;
  if (!expected) throw forbidden("OPS_SECRET não configurado");

  const provided =
    request.headers.get("x-ops-secret") ??
    new URL(request.url).searchParams.get("secret") ??
    "";

  if (provided.length !== expected.length) throw forbidden("Segredo inválido");
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= provided.charCodeAt(i) ^ expected.charCodeAt(i);
  if (diff !== 0) throw forbidden("Segredo inválido");
}
