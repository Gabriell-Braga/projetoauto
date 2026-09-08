import type { SiteLinks } from "../templates/contract";

/**
 * Os enderecos que o template usa para navegar.
 *
 * O mesmo site vive em dois lugares: no painel, sob `/r/<slug>`; no dominio da
 * revenda, na raiz. O que muda entre os dois e SO o prefixo — as paginas, os
 * nomes e a query string sao os mesmos. Por isso o prefixo e argumento, e nao
 * duas funcoes parecidas que alguem vai esquecer de atualizar junto.
 *
 * `prefix` vem sem barra no fim: "" para dominio proprio, "/r/loja" no painel.
 */
export function buildSiteLinks(prefix: string, whatsappDigits: string | null): SiteLinks {
  const at = (subPath = "") => `${prefix}${subPath}` || "/";

  return {
    home: at(),
    stock: at("/estoque"),
    contact: at("/contato"),
    financing: at("/financiamento"),
    sellCar: at("/venda-seu-carro"),
    about: at("/sobre"),
    privacy: at("/privacidade"),
    terms: at("/termos"),
    vehicle: (vehicleSlug: string) => at(`/veiculo/${vehicleSlug}`),
    stockWith: (params) => {
      const query = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== "") query.set(key, String(value));
      }
      const suffix = query.toString();
      return at(suffix ? `/estoque?${suffix}` : "/estoque");
    },
    whatsapp: (message: string) =>
      whatsappDigits
        ? `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(message)}`
        : null,
  };
}
