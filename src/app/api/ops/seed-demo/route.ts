import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { tenants, vehiclePhotos, vehicles } from "@/db/schema";
import { badRequest, jsonOk, notFound, withApi } from "@/lib/http";
import { assertOpsSecret } from "@/lib/ops";
import { putObject, vehiclePhotoKey } from "@/lib/storage/r2";
import { syncVehiclePhotoState } from "@/lib/services/vehicles";
import { DEMO_STOCK, type DemoVehicle } from "@/lib/dev/demo-stock";

export const dynamic = "force-dynamic";

/**
 * Povoa uma revenda de TESTE com estoque de demonstração.
 *
 * TEMPORÁRIO — sai do código quando o teste acabar. Rota que cria dado de
 * mentira num banco de produção é um pé no vidro: mesmo atrás do segredo, ela
 * só deve existir enquanto for necessária.
 *
 * Trabalha em PASSOS, um veículo por chamada. Buscar as fotos de vinte carros
 * numa requisição só estouraria o limite de sub-requisições do Worker, e o
 * erro chegaria no meio — com metade do estoque criado e nenhuma pista de
 * onde parou. Cada chamada devolve quanto falta, e quem chama repete.
 */

/** Confirmação escrita: dedo escorregado não popula um banco. */
const CONFIRMACAO = "sim-quero-dados-de-teste";

const TAMANHOS = {
  thumb: { w: 400, h: 300 },
  card: { w: 800, h: 600 },
  full: { w: 1600, h: 1200 },
} as const;

const FOTOS_POR_VEICULO = 3;

/**
 * Fotos do LoremFlickr: imagens do Flickr sob Creative Commons.
 *
 * `lock` deixa a escolha determinística — sem ele, cada tamanho do MESMO
 * anúncio viria de uma foto diferente, e a galeria mostraria três carros
 * distintos como se fossem o mesmo veículo.
 */
function photoUrl(tags: string, lock: number, size: { w: number; h: number }): string {
  /*
   * Tag com ESPAÇO faz o serviço responder 403.
   *
   * "pickup truck" derrubou a semeadura no segundo veículo, e o erro chegou
   * como 500 genérico — nada apontava para a tag. Aqui qualquer coisa que não
   * seja letra ou número vira separador de tag.
   */
  const limpas = tags
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .join(",");
  return `https://loremflickr.com/${size.w}/${size.h}/${limpas}?lock=${lock}`;
}

/**
 * Tentativas, da mais específica para a mais genérica.
 *
 * Nem toda combinação de marca e modelo tem foto no acervo, e uma tag sem
 * resultado derruba o veículo inteiro. Melhor um carro genérico do que um
 * anúncio sem foto nenhuma — e melhor ainda não interromper a semeadura por
 * causa de um.
 */
function tentativas(tags: string): string[] {
  const partes = tags.split(/[^a-zA-Z0-9]+/).filter(Boolean);
  return [partes.join(","), partes.slice(0, 2).join(","), partes[0] ?? "car", "car"];
}

async function fetchFoto(tags: string, lock: number, size: { w: number; h: number }) {
  let ultimoErro = "";
  for (const tentativa of tentativas(tags)) {
    const resposta = await fetch(photoUrl(tentativa, lock, size), { redirect: "follow" });
    if (resposta.ok) return await resposta.arrayBuffer();
    ultimoErro = `${resposta.status} em "${tentativa}"`;
  }

  // último recurso: fonte que nunca recusa, para a semeadura não parar
  const reserva = await fetch(`https://picsum.photos/seed/${lock}/${size.w}/${size.h}`, {
    redirect: "follow",
  });
  if (reserva.ok) return await reserva.arrayBuffer();

  throw new Error(`nenhuma foto respondeu (${ultimoErro})`);
}

async function addPhotos(tenantId: string, vehicleId: string, demo: DemoVehicle) {
  const db = await getDb();

  for (let indice = 0; indice < FOTOS_POR_VEICULO; indice++) {
    const photoId = crypto.randomUUID();
    // trava por veículo E por posição: fotos diferentes do mesmo carro
    const lock = Math.abs(hash(`${demo.slug}-${indice}`)) % 100000;
    const variants: Record<string, string> = {};

    for (const [variant, size] of Object.entries(TAMANHOS)) {
      const bytes = await fetchFoto(demo.photoTags, lock, size);
      const key = vehiclePhotoKey(
        tenantId,
        vehicleId,
        photoId,
        variant as keyof typeof TAMANHOS,
        "jpg",
      );
      await putObject(key, bytes, "image/jpeg");
      variants[variant] = key;
    }

    await db.insert(vehiclePhotos).values({
      id: photoId,
      tenantId,
      vehicleId,
      variants: variants as { thumb: string; card: string; full: string },
      width: TAMANHOS.full.w,
      height: TAMANHOS.full.h,
      position: indice,
      isCover: indice === 0,
    });
  }

  await syncVehiclePhotoState(tenantId, vehicleId);
}

/** Hash estável para a trava da foto; não precisa ser criptográfico. */
function hash(texto: string): number {
  let valor = 0;
  for (let i = 0; i < texto.length; i++) {
    valor = (valor << 5) - valor + texto.charCodeAt(i);
    valor |= 0;
  }
  return valor;
}

export const POST = withApi(async (request: Request) => {
  assertOpsSecret(request);

  const body = (await request.json().catch(() => ({}))) as {
    slug?: string;
    confirm?: string;
  };

  if (body.confirm !== CONFIRMACAO) {
    throw badRequest(`Envie confirm: "${CONFIRMACAO}" para popular esta revenda.`);
  }
  if (!body.slug) throw badRequest("Informe o slug da revenda.");

  const db = await getDb();
  const [tenant] = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.slug, body.slug))
    .limit(1);
  if (!tenant) throw notFound("Revenda não encontrada");

  // 1) cria o que faltar. Sem sub-requisição nenhuma: é barato e idempotente.
  const existentes = await db
    .select({ id: vehicles.id, slug: vehicles.slug, photosCount: vehicles.photosCount })
    .from(vehicles)
    .where(eq(vehicles.tenantId, tenant.id))
    .orderBy(asc(vehicles.slug));

  const porSlug = new Map(existentes.map((v) => [v.slug, v]));
  let criados = 0;

  for (const demo of DEMO_STOCK) {
    if (porSlug.has(demo.slug)) continue;
    await db.insert(vehicles).values({
      id: crypto.randomUUID(),
      tenantId: tenant.id,
      slug: demo.slug,
      brand: demo.brand,
      model: demo.model,
      version: demo.version,
      yearManufacture: demo.yearManufacture,
      yearModel: demo.yearModel,
      mileageKm: demo.mileageKm,
      priceCents: demo.priceCents,
      transmission: demo.transmission,
      fuel: demo.fuel,
      bodyType: demo.bodyType,
      color: demo.color,
      doors: demo.doors,
      licensePlate: demo.licensePlate,
      options: demo.options,
      description: demo.description,
      featured: demo.featured,
      status: demo.reserved ? "reserved" : "available",
    });
    criados++;
  }

  // 2) fotos de UM veículo por chamada
  const semFoto = await db
    .select({ id: vehicles.id, slug: vehicles.slug })
    .from(vehicles)
    .where(eq(vehicles.tenantId, tenant.id))
    .orderBy(asc(vehicles.slug));

  const pendentes = semFoto.filter((v) => {
    const demo = DEMO_STOCK.find((d) => d.slug === v.slug);
    if (!demo) return false;
    const atual = porSlug.get(v.slug);
    return !atual || atual.photosCount === 0;
  });

  const alvo = pendentes[0];
  let fotos = 0;
  if (alvo) {
    const demo = DEMO_STOCK.find((d) => d.slug === alvo.slug)!;
    await addPhotos(tenant.id, alvo.id, demo);
    fotos = FOTOS_POR_VEICULO;
  }

  return jsonOk({
    veiculosCriados: criados,
    fotosAdicionadas: fotos,
    veiculoDaVez: alvo?.slug ?? null,
    faltamComFoto: Math.max(0, pendentes.length - (alvo ? 1 : 0)),
  });
});
