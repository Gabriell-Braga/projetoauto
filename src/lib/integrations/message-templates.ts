/**
 * Modelos de mensagem com variáveis.
 *
 * O que dá para entregar hoje sem provedor de WhatsApp: a revenda escreve o
 * texto uma vez, o sistema preenche os dados do lead e abre o aplicativo com a
 * mensagem pronta. Quando existir API oficial, o mesmo texto passa a ser
 * enviado por ela sem ninguém reescrever nada.
 */

export type TemplateContext = {
  nome?: string | null;
  primeiro_nome?: string | null;
  veiculo?: string | null;
  preco?: string | null;
  vendedor?: string | null;
  revenda?: string | null;
  telefone?: string | null;
};

export const TEMPLATE_VARIABLES: { key: keyof TemplateContext; label: string }[] = [
  { key: "primeiro_nome", label: "Primeiro nome do cliente" },
  { key: "nome", label: "Nome completo do cliente" },
  { key: "veiculo", label: "Veículo de interesse" },
  { key: "preco", label: "Preço do veículo" },
  { key: "vendedor", label: "Quem está atendendo" },
  { key: "revenda", label: "Nome da revenda" },
];

/** Reconhece {{variavel}}, tolerando espaços dentro das chaves. */
const PLACEHOLDER = /\{\{\s*([a-z_]+)\s*\}\}/gi;

/**
 * Preenche o texto com os dados do lead.
 *
 * Variável sem valor vira string vazia, e a linha é limpa de espaços duplos —
 * a alternativa seria mandar "Olá {{primeiro_nome}}" para o cliente, que é
 * pior do que "Olá". Variável desconhecida também some, em vez de aparecer
 * crua: quem escreveu errou o nome, e o cliente não tem culpa disso.
 */
export function renderTemplate(body: string, context: TemplateContext): string {
  return body
    .replace(PLACEHOLDER, (_match, name: string) => {
      const value = context[name.toLowerCase() as keyof TemplateContext];
      return value ? String(value) : "";
    })
    .replace(/[ \t]{2,}/g, " ")
    .replace(/ +([,.!?])/g, "$1")
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .trim();
}

/** Primeiro nome, para tratar o cliente sem formalidade de cartório. */
export function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? "";
}

/** Variáveis citadas no texto que não existem — erro de digitação de quem escreveu. */
export function unknownVariables(body: string): string[] {
  const known = new Set(TEMPLATE_VARIABLES.map((variable) => variable.key as string));
  const found = new Set<string>();

  for (const match of body.matchAll(PLACEHOLDER)) {
    const name = match[1].toLowerCase();
    if (!known.has(name) && name !== "telefone") found.add(name);
  }
  return [...found];
}

/**
 * Link que abre o WhatsApp com a mensagem escrita.
 *
 * `wa.me` funciona sem contrato, sem API e em qualquer aparelho — é por isso
 * que dá para entregar isto hoje. O número vai com 55 na frente porque o
 * WhatsApp exige o país, e sem ele o link abre uma conversa vazia.
 */
export function whatsappLink(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, "");
  const withCountry = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${withCountry}?text=${encodeURIComponent(message)}`;
}

/** Modelos iniciais, para a revenda ter algo utilizável no primeiro dia. */
export const DEFAULT_TEMPLATES: { name: string; body: string }[] = [
  {
    name: "Primeiro contato",
    body: "Olá {{primeiro_nome}}! Aqui é {{vendedor}}, da {{revenda}}. Vi que você se interessou pelo {{veiculo}}. Ele está disponível — quer combinar um horário para ver de perto?",
  },
  {
    name: "Retomar contato",
    body: "Oi {{primeiro_nome}}, tudo bem? Passando para saber se você ainda tem interesse no {{veiculo}}. Qualquer dúvida, é só chamar.",
  },
  {
    name: "Enviar preço",
    body: "{{primeiro_nome}}, o {{veiculo}} está por {{preco}}. Trabalhamos com financiamento e aceitamos seu carro na troca. Quer que eu simule?",
  },
  {
    name: "Confirmar visita",
    body: "{{primeiro_nome}}, confirmando nossa visita para ver o {{veiculo}}. Estarei te esperando na loja. Até breve!",
  },
];
