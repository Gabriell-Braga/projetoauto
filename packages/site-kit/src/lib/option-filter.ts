/**
 * Filtro das listas de escolha do painel.
 *
 * Fica fora do componente porque é a parte que erra em silêncio: um acento
 * mal tratado esconde a Citroën da lista de marcas e a pessoa conclui que a
 * marca não existe no sistema.
 */

export type FilterableOption = { label: string };

const COMBINING = new RegExp("[\\u0300-\\u036f]", "g");

/** "Citroën", "CITROEN" e "citroen" são a mesma marca para quem digita. */
export function fold(text: string): string {
  return text.normalize("NFD").replace(COMBINING, "").toLowerCase();
}

/**
 * Busca por trecho, não por começo.
 *
 * Os nomes da FIPE vêm com a marca na frente ("VW - Gol 1.0"), então filtrar
 * pelo começo obrigaria a saber como a tabela escreve o prefixo — e quem
 * digita "gol" está procurando o Gol.
 */
export function filterOptions<T extends FilterableOption>(options: T[], query: string): T[] {
  const term = fold(query.trim());
  if (!term) return options;
  return options.filter((option) => fold(option.label).includes(term));
}
