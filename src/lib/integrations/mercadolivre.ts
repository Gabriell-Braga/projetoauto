/**
 * Notificações do Mercado Livre.
 *
 * O ML não entrega o evento: avisa que "algo mudou" em `resource` e espera
 * que a gente busque. A URL é cadastrada no app (uma para todas as revendas)
 * e ele identifica a conta por `user_id` — o mesmo que guardamos ao conectar.
 *
 * Referência: https://developers.mercadolivre.com.br/pt_br/produto-receba-notificacoes
 */

export type MercadoLivreNotification = {
  /** Id que o ML atribui à notificação; é a chave de idempotência. */
  id: string;
  topic: string;
  /** Caminho do recurso que mudou, ex.: "/items/MLB123". */
  resource: string;
  /** Conta da loja no ML, como string — é assim que fica na conexão. */
  externalUserId: string;
  applicationId: string;
};

type RawNotification = {
  _id?: unknown;
  topic?: unknown;
  resource?: unknown;
  user_id?: unknown;
  application_id?: unknown;
  sent?: unknown;
};

/**
 * Lê o corpo do jeito que o ML manda; devolve null para o que não é dele.
 *
 * `_id` nem sempre vem: quando falta, a chave passa a ser recurso + instante
 * de envio, que é o que torna dois reenvios do mesmo aviso iguais.
 */
export function parseNotification(body: unknown): MercadoLivreNotification | null {
  if (!body || typeof body !== "object") return null;
  const raw = body as RawNotification;

  if (typeof raw.topic !== "string" || typeof raw.resource !== "string") return null;
  if (raw.user_id === undefined || raw.application_id === undefined) return null;

  const id =
    typeof raw._id === "string" && raw._id
      ? raw._id
      : `${raw.resource}@${typeof raw.sent === "string" ? raw.sent : "sem-data"}`;

  return {
    id,
    topic: raw.topic,
    resource: raw.resource,
    externalUserId: String(raw.user_id),
    applicationId: String(raw.application_id),
  };
}
