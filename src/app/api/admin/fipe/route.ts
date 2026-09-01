import { requireApiTenant } from "@/lib/auth/guards";
import { badRequest, jsonOk, withApi } from "@/lib/http";
import { getQuote, listBrands, listModels, listYears } from "@/lib/integrations/fipe";

export const dynamic = "force-dynamic";

/**
 * Ponte para a tabela FIPE.
 *
 * Uma rota só, com o passo em `etapa`, em vez de quatro: o formulário percorre
 * marca → modelo → ano → preço em sequência, e uma rota por passo só
 * multiplicaria arquivo sem separar responsabilidade nenhuma.
 *
 * Exige sessão da revenda porque o resultado é cacheado por nós; aberta, seria
 * um proxy gratuito para qualquer um consultar a FIPE às nossas custas.
 */
export const GET = withApi(async (request: Request) => {
  await requireApiTenant("vehicles:read");

  const query = new URL(request.url).searchParams;
  const step = query.get("etapa");
  const brand = query.get("marca");
  const model = query.get("modelo");
  const year = query.get("ano");

  if (step === "marcas") {
    return jsonOk({ marcas: await listBrands() });
  }

  if (step === "modelos") {
    if (!brand) throw badRequest("Informe a marca");
    return jsonOk({ modelos: await listModels(brand) });
  }

  if (step === "anos") {
    if (!brand || !model) throw badRequest("Informe marca e modelo");
    return jsonOk({ anos: await listYears(brand, model) });
  }

  if (step === "preco") {
    if (!brand || !model || !year) throw badRequest("Informe marca, modelo e ano");
    return jsonOk(await getQuote(brand, model, year));
  }

  throw badRequest("Etapa inválida");
});
