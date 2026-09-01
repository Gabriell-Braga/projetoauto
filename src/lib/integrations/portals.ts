/**
 * Portais de classificados que a revenda pode conectar.
 *
 * O objetivo do catálogo é tirar a configuração de fora: a revenda liga a
 * conta dela aqui, uma vez, e depois publica, atualiza e remove sem abrir o
 * portal. O passo externo que sobra é obter o acesso — e ele varia por portal,
 * então cada um traz a instrução do que pedir e a quem.
 */

export type ConnectionMethod =
  /** Redireciona para o portal, a pessoa autoriza e volta. Nada é digitado. */
  | "oauth"
  /** A revenda cola credenciais que o portal forneceu a ela. */
  | "credentials"
  /** O portal só busca o nosso feed; não há o que conectar. */
  | "feed";

/** Se dá para conectar hoje ou se falta acordo comercial nosso com o portal. */
export type PortalAvailability = "pronto" | "aguardando_acesso";

export type PortalField = {
  key: string;
  label: string;
  /** Vai para o cofre cifrado e nunca volta para a tela. */
  secret: boolean;
  hint?: string;
};

export type PortalDefinition = {
  key: string;
  name: string;
  method: ConnectionMethod;
  availability: PortalAvailability;
  fields: PortalField[];
  /** O que a revenda precisa fazer, uma única vez, para conseguir o acesso. */
  howToConnect: string;
};

export const PORTALS: PortalDefinition[] = [
  {
    key: "webmotors",
    name: "Webmotors",
    method: "credentials",
    availability: "aguardando_acesso",
    fields: [
      { key: "clientId", label: "Client ID", secret: false },
      { key: "clientSecret", label: "Client Secret", secret: true },
      {
        key: "dealerId",
        label: "Código da loja",
        secret: false,
        hint: "O mesmo que aparece no painel do Webmotors.",
      },
    ],
    howToConnect:
      "Entre no Webmotors com o login da loja, abra o chat de atendimento e peça a criação de um usuário de API para integração de anúncios. Eles devolvem as credenciais — cole aqui e não precisa voltar lá.",
  },
  {
    key: "icarros",
    name: "iCarros",
    method: "oauth",
    availability: "aguardando_acesso",
    fields: [],
    howToConnect:
      "Clique em conectar: você é levado ao login do iCarros, autoriza o acesso e volta para cá. Nenhuma configuração acontece dentro do portal.",
  },
  {
    key: "olx",
    name: "OLX Autos",
    method: "oauth",
    availability: "aguardando_acesso",
    fields: [],
    howToConnect:
      "Clique em conectar e autorize com a conta da loja na OLX. A autorização é única e pode ser revogada por aqui.",
  },
  {
    key: "mercadolivre",
    name: "Mercado Livre",
    method: "oauth",
    availability: "aguardando_acesso",
    fields: [],
    howToConnect:
      "Clique em conectar e autorize com a conta da loja no Mercado Livre. A autorização é única e pode ser revogada por aqui.",
  },
  {
    key: "feed",
    name: "Outros portais (por feed)",
    method: "feed",
    availability: "pronto",
    fields: [],
    howToConnect:
      "Para portais sem API, entregue o endereço do feed de estoque. Eles buscam sozinhos e mantêm os anúncios em dia. O endereço está na tela de API e webhooks.",
  },
];

export function getPortal(key: string): PortalDefinition | undefined {
  return PORTALS.find((portal) => portal.key === key);
}

export const PORTAL_KEYS = PORTALS.map((portal) => portal.key);

/* ------------------------------------------------------------------------ */
/* Estado da publicação                                                      */
/* ------------------------------------------------------------------------ */

export const PUBLICATION_STATUS = [
  "pendente",
  "publicado",
  "removendo",
  "removido",
  "erro",
] as const;
export type PublicationStatus = (typeof PUBLICATION_STATUS)[number];

export const PUBLICATION_LABELS: Record<PublicationStatus, string> = {
  pendente: "Aguardando envio",
  publicado: "Publicado",
  removendo: "Removendo",
  removido: "Removido",
  erro: "Erro",
};

/**
 * O que deve acontecer no portal quando o veículo muda de situação aqui.
 *
 * Vendido sai do portal na hora — anúncio de carro vendido gera lead que a
 * revenda não tem como atender, e é a reclamação número um de quem usa
 * integrador ruim. Rascunho também não vai: é ficha pela metade.
 */
export function targetPublicationStatus(vehicleStatus: string): PublicationStatus {
  if (vehicleStatus === "available" || vehicleStatus === "reserved") return "pendente";
  return "removendo";
}

/** Situações em que o anúncio deve estar no ar. */
export function shouldBePublished(vehicleStatus: string): boolean {
  return vehicleStatus === "available" || vehicleStatus === "reserved";
}
