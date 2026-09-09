import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { tenantBanners, tenantSites, tenants, vehiclePhotos, vehicles } from "@/db/schema";
import { badRequest, jsonOk, notFound, withApi } from "@/lib/http";
import { assertOpsSecret } from "@/lib/ops";
import { putObject, tenantAssetKey, vehiclePhotoKey } from "@/lib/storage/r2";
import { syncVehiclePhotoState } from "@/lib/services/vehicles";
import { DEMO_STOCK, type DemoVehicle } from "@/lib/dev/demo-stock";
import { DEMO_SITE } from "@/lib/dev/demo-site";
import { baixar, buscarFotos } from "@/lib/dev/demo-photos";
import { faviconSvg, iniciaisDe, logoSvg } from "@/lib/dev/demo-brand";

export const dynamic = "force-dynamic";

/**
 * Povoa uma revenda de TESTE com estoque e dados de demonstração.
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

const LARGURAS = { thumb: 400, card: 800, full: 1600 };
const FOTOS_POR_VEICULO = 3;

async function addPhotos(
  tenantId: string,
  vehicleId: string,
  demo: DemoVehicle,
): Promise<number> {
  const db = await getDb();
  const encontradas = await buscarFotos(demo.photoTerms, LARGURAS, FOTOS_POR_VEICULO);
  if (encontradas.length === 0) return 0;

  for (let indice = 0; indice < encontradas.length; indice++) {
    const foto = encontradas[indice];
    const photoId = crypto.randomUUID();
    const variants: Record<string, string> = {};

    for (const variant of Object.keys(LARGURAS) as (keyof typeof LARGURAS)[]) {
      const bytes = await baixar(foto.urls[variant]);
      const key = vehiclePhotoKey(tenantId, vehicleId, photoId, variant, "jpg");
      await putObject(key, bytes, "image/jpeg");
      variants[variant] = key;
    }

    await db.insert(vehiclePhotos).values({
      id: photoId,
      tenantId,
      vehicleId,
      variants: variants as { thumb: string; card: string; full: string },
      position: indice,
      isCover: indice === 0,
    });
  }

  await syncVehiclePhotoState(tenantId, vehicleId);
  return encontradas.length;
}

/**
 * As duas fotos da loja: fachada e estrutura.
 *
 * O template as usa no Sobre e na home. Sem elas, dois blocos grandes ficam
 * como espaco reservado escrito "Foto da loja" — o que faz um site pronto
 * parecer inacabado.
 */
const BANNERS = [
  { termos: ["Car dealership showroom", "Car dealership", "showroom"], titulo: "Nossa loja" },
  { termos: ["Automobile repair shop", "Car service", "garage"], titulo: "Nossa estrutura" },
];

async function addBanners(tenantId: string): Promise<number> {
  const db = await getDb();
  let criados = 0;

  for (let posicao = 0; posicao < BANNERS.length; posicao++) {
    const banner = BANNERS[posicao];
    const encontradas = await buscarFotos(banner.termos, { full: 1600 }, 1);
    if (encontradas.length === 0) continue;

    const bytes = await baixar(encontradas[0].urls.full);
    const key = tenantAssetKey(tenantId, "banners", crypto.randomUUID(), "jpg");
    await putObject(key, bytes, "image/jpeg");

    await db.insert(tenantBanners).values({
      id: crypto.randomUUID(),
      tenantId,
      imageKey: key,
      title: banner.titulo,
      position: posicao,
      active: true,
    });
    criados++;
  }

  return criados;
}

/**
 * Grava um SVG de marca no bucket e devolve a chave.
 *
 * A chave e derivada do tipo, e nao de um uuid: reexecutar a semeadura
 * sobrescreve o mesmo arquivo em vez de deixar um orfao por rodada.
 */
async function gravarMarca(tenantId: string, kind: "logo" | "favicon", svg: string) {
  const key = tenantAssetKey(tenantId, kind, "demo", "svg");
  await putObject(key, new TextEncoder().encode(svg).buffer as ArrayBuffer, "image/svg+xml");
  return key;
}

export const POST = withApi(async (request: Request) => {
  assertOpsSecret(request);

  const body = (await request.json().catch(() => ({}))) as {
    slug?: string;
    confirm?: string;
    /** Apaga as fotos antes de recomeçar; usado quando a fonte anterior errou. */
    resetPhotos?: boolean;
  };

  if (body.confirm !== CONFIRMACAO) {
    throw badRequest(`Envie confirm: "${CONFIRMACAO}" para popular esta revenda.`);
  }
  if (!body.slug) throw badRequest("Informe o slug da revenda.");

  const db = await getDb();
  const [tenant] = await db
    .select({ id: tenants.id, name: tenants.name })
    .from(tenants)
    .where(eq(tenants.slug, body.slug))
    .limit(1);
  if (!tenant) throw notFound("Revenda não encontrada");

  /*
   * Reset: apaga o vínculo das fotos, não os objetos no bucket.
   *
   * Apagar no R2 custaria uma sub-requisição por arquivo e é o que mais
   * arriscaria estourar o limite bem no passo de limpeza. Os órfãos ficam, e
   * somem junto com a revenda de teste no fim.
   */
  if (body.resetPhotos) {
    await db.delete(vehiclePhotos).where(eq(vehiclePhotos.tenantId, tenant.id));
    await db.delete(tenantBanners).where(eq(tenantBanners.tenantId, tenant.id));
    await db
      .update(vehicles)
      .set({ photosCount: 0, coverPhotoKey: null })
      .where(eq(vehicles.tenantId, tenant.id));
    return jsonOk({ resetado: true, veiculosCriados: 0, fotosAdicionadas: 0, faltamComFoto: null });
  }

  // 1) dados da empresa. Barato e idempotente: sobrescreve sempre.
  await db
    .update(tenantSites)
    .set({
      phone: DEMO_SITE.phone,
      whatsapp: DEMO_SITE.whatsapp,
      email: DEMO_SITE.email,
      addressStreet: DEMO_SITE.addressStreet,
      addressNumber: DEMO_SITE.addressNumber,
      addressComplement: DEMO_SITE.addressComplement,
      addressDistrict: DEMO_SITE.addressDistrict,
      addressCity: DEMO_SITE.addressCity,
      addressState: DEMO_SITE.addressState,
      addressZip: DEMO_SITE.addressZip,
      mapsUrl: DEMO_SITE.mapsUrl,
      businessHours: DEMO_SITE.businessHours,
      social: DEMO_SITE.social,
      aboutTitle: DEMO_SITE.aboutTitle,
      aboutText: DEMO_SITE.aboutText,
      stats: DEMO_SITE.stats,
      reviews: DEMO_SITE.reviews,
      financing: DEMO_SITE.financing,
      legalPrivacy: DEMO_SITE.legalPrivacy,
      legalTerms: DEMO_SITE.legalTerms,
      legalUpdatedAt: new Date(),
      logoKey: await gravarMarca(tenant.id, "logo", logoSvg(tenant.name, iniciaisDe(tenant.name))),
      faviconKey: await gravarMarca(tenant.id, "favicon", faviconSvg(iniciaisDe(tenant.name))),
    })
    .where(eq(tenantSites.tenantId, tenant.id));

  // 2) cria o estoque que faltar. Sem sub-requisição: é barato e idempotente.
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

  // 3) fotos de UM veículo por chamada
  const todos = await db
    .select({ id: vehicles.id, slug: vehicles.slug, photosCount: vehicles.photosCount })
    .from(vehicles)
    .where(eq(vehicles.tenantId, tenant.id))
    .orderBy(asc(vehicles.slug));

  const pendentes = todos.filter(
    (v) => v.photosCount === 0 && DEMO_STOCK.some((d) => d.slug === v.slug),
  );

  const alvo = pendentes[0];
  let fotos = 0;
  let banners = 0;

  if (alvo) {
    const demo = DEMO_STOCK.find((d) => d.slug === alvo.slug)!;
    fotos = await addPhotos(tenant.id, alvo.id, demo);
  } else {
    /*
     * Os banners entram DEPOIS do estoque, e nunca na mesma chamada.
     *
     * Cada um custa mais uma busca e um download; somados aos nove do veiculo
     * da vez, seria a rajada que ja derrubou a semeadura uma vez.
     */
    const jaTem = await db
      .select({ id: tenantBanners.id })
      .from(tenantBanners)
      .where(eq(tenantBanners.tenantId, tenant.id))
      .limit(1);
    if (jaTem.length === 0) banners = await addBanners(tenant.id);
  }

  return jsonOk({
    veiculosCriados: criados,
    fotosAdicionadas: fotos,
    bannersAdicionados: banners,
    veiculoDaVez: alvo?.slug ?? null,
    /*
     * Veículo sem foto no acervo não pode travar a fila.
     *
     * Se `addPhotos` não achou nada, `photosCount` continua zero e a próxima
     * chamada escolheria o MESMO veículo para sempre. O aviso sai aqui para
     * quem está rodando decidir o que fazer.
     */
    semFotoNoAcervo: alvo && fotos === 0 ? alvo.slug : null,
    faltamComFoto: Math.max(0, pendentes.length - (fotos > 0 ? 1 : 0)),
  });
});
