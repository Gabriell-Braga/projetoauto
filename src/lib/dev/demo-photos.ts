/**
 * Fotos de demonstração vindas do Wikimedia Commons.
 *
 * TEMPORÁRIO, como o resto da semeadura.
 *
 * A primeira tentativa usou o LoremFlickr, que casa por tag do Flickr. Deu
 * errado de um jeito instrutivo: nome de modelo colide com palavra comum, e
 * "Toro" trouxe uma estátua de touro, "S10" trouxe uma picape de brinquedo. O
 * acervo era grande, mas a busca não entendia que o assunto era carro.
 *
 * O Commons resolve isso porque a busca é por TÍTULO de arquivo catalogado:
 * "Chevrolet Onix" devolve fotos de Chevrolet Onix. É livre, não pede chave, e
 * as imagens são todas de licença aberta.
 */

const API = "https://commons.wikimedia.org/w/api.php";

/**
 * O Wikimedia recusa cliente sem User-Agent identificável.
 *
 * É política deles, não capricho: sem isto a resposta é 403 e nada explica o
 * motivo.
 */
const USER_AGENT = "ProjetoAuto/1.0 (semeadura de ambiente de teste)";

type Resultado = { pages?: Record<string, Page> };
type Page = {
  title: string;
  imageinfo?: { thumburl?: string; mime?: string }[];
};

/**
 * Título do arquivo -> URL na largura pedida.
 *
 * Chaveado pelo título porque as três variantes da MESMA foto precisam vir do
 * mesmo arquivo. Sem isso a galeria mostraria três carros diferentes como se
 * fossem o mesmo veículo.
 *
 * O Commons só serve larguras de uma lista fixa, então quem escolhe o tamanho
 * é a API — trocar o número na URL na mão devolve 400.
 */
async function buscar(termo: string, largura: number, limite: number): Promise<Map<string, string>> {
  const url =
    `${API}?action=query&generator=search` +
    `&gsrsearch=${encodeURIComponent(termo)}` +
    `&gsrnamespace=6&gsrlimit=${limite}` +
    `&prop=imageinfo&iiprop=url|mime&iiurlwidth=${largura}&format=json`;

  let resposta = await fetch(url, { headers: { "user-agent": USER_AGENT } });

  /*
   * Uma segunda chance depois de uma pausa.
   *
   * As buscas saíam em paralelo e o Wikimedia recusava a rajada; como um erro
   * virava mapa vazio em silêncio, o resultado aparecia como "este carro não
   * existe no acervo" — que é um diagnóstico completamente diferente e mandou
   * a investigação para o lado errado.
   */
  if (!resposta.ok) {
    await new Promise((r) => setTimeout(r, 700));
    resposta = await fetch(url, { headers: { "user-agent": USER_AGENT } });
  }

  if (!resposta.ok) {
    throw new Error(`Commons respondeu ${resposta.status} para "${termo}" (${largura}px)`);
  }

  const corpo = (await resposta.json()) as { query?: Resultado };
  const pages = Object.values(corpo.query?.pages ?? {});

  const encontradas = new Map<string, string>();
  for (const page of pages) {
    const info = page.imageinfo?.[0];
    // svg e tiff existem no acervo e não servem como foto de anúncio
    if (!info?.thumburl || !info.mime?.startsWith("image/")) continue;
    if (info.mime === "image/svg+xml") continue;
    encontradas.set(page.title, info.thumburl);
  }
  return encontradas;
}

export type FotoDemo = { titulo: string; urls: Record<string, string> };

/**
 * Até `quantas` fotos do veículo, cada uma nas larguras pedidas.
 *
 * Busca do específico para o genérico: "Chevrolet Onix", depois "Chevrolet
 * car". Modelo que o acervo não tem cai na marca, e marca sem foto devolve
 * lista vazia — a semeadura segue sem esse veículo em vez de parar.
 */
export async function buscarFotos(
  termos: string[],
  larguras: Record<string, number>,
  quantas: number,
): Promise<FotoDemo[]> {
  for (const termo of termos) {
    const nomes = Object.keys(larguras);
    /*
     * Uma busca por largura, EM SÉRIE.
     *
     * Em paralelo eram três chamadas simultâneas por veículo, mais os nove
     * downloads do veículo anterior — o Wikimedia recusava a rajada. Três
     * chamadas em fila custam cerca de um segundo a mais por carro e não
     * derrubam nada.
     */
    const porLargura: Map<string, string>[] = [];
    for (const nome of nomes) {
      porLargura.push(await buscar(termo, larguras[nome], quantas + 4));
    }

    // só serve o arquivo que existe em TODAS as larguras
    const [primeira, ...resto] = porLargura;
    const completos = [...primeira.keys()].filter((titulo) =>
      resto.every((mapa) => mapa.has(titulo)),
    );

    if (completos.length === 0) continue;

    return completos.slice(0, quantas).map((titulo) => ({
      titulo,
      urls: Object.fromEntries(nomes.map((nome, i) => [nome, porLargura[i].get(titulo)!])),
    }));
  }

  return [];
}

export async function baixar(url: string): Promise<ArrayBuffer> {
  const resposta = await fetch(url, { headers: { "user-agent": USER_AGENT } });
  if (!resposta.ok) throw new Error(`foto respondeu ${resposta.status}`);
  return await resposta.arrayBuffer();
}
