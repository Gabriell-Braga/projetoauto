import { unauthorized } from "@/lib/http";
import { requireFeature } from "@/lib/api/feature-guard";
import { authenticateApiKey } from "@/lib/services/api-access";

/**
 * Autentica a revenda pela chave de API.
 *
 * Aceita `Authorization: Bearer <chave>` e `x-api-key`. O Bearer é o que a
 * maioria das ferramentas manda por padrão; o header próprio existe para quem
 * integra de um lugar onde o Authorization já é usado por outra coisa.
 *
 * A checagem de plano vem depois da autenticação de propósito: quem manda
 * chave inválida recebe 401, e quem manda chave boa de um plano sem o recurso
 * recebe 403 dizendo o que contratar. Misturar os dois esconderia qual é o
 * problema.
 */
export async function requireApiKey(request: Request): Promise<{ tenantId: string }> {
  const header = request.headers.get("authorization");
  const bearer = header?.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : null;
  const key = bearer ?? request.headers.get("x-api-key")?.trim() ?? "";

  if (!key) throw unauthorized("Envie a chave em Authorization: Bearer ou x-api-key");

  const found = await authenticateApiKey(key);
  if (!found) throw unauthorized("Chave inválida ou revogada");

  await requireFeature(found.tenantId, "api_webhooks");
  return found;
}
