import { describe, expect, it, vi } from "vitest";
import type { Vehicle } from "@/db/schema";
import {
  MercadoLivreClient,
  itemAttributes,
  itemPayload,
  itemTitle,
  parseNotification,
  refreshTokens,
  sellerContact,
  stateName,
  updatePayload,
  type SellerInfo,
} from "./mercadolivre";

const sample = {
  _id: "abc-1",
  resource: "/items/MLB123",
  user_id: 987,
  topic: "items",
  application_id: 5555,
  attempts: 1,
  sent: "2026-09-16T10:00:00.000Z",
  received: "2026-09-16T10:00:00.100Z",
};

describe("parseNotification", () => {
  it("lê o formato do ML e normaliza os ids para string", () => {
    expect(parseNotification(sample)).toEqual({
      id: "abc-1",
      topic: "items",
      resource: "/items/MLB123",
      externalUserId: "987",
      applicationId: "5555",
    });
  });

  it("sem _id, recurso + envio viram a chave — reenvio do mesmo aviso não duplica", () => {
    const { _id: _omit, ...withoutId } = sample;
    void _omit;
    expect(parseNotification(withoutId)?.id).toBe("/items/MLB123@2026-09-16T10:00:00.000Z");
  });

  it("recusa o que não tem cara de notificação", () => {
    expect(parseNotification(null)).toBeNull();
    expect(parseNotification({ topic: "items" })).toBeNull();
    expect(parseNotification("texto")).toBeNull();
  });
});

/* ------------------------------------------------------------------------ */

const vehicle = {
  id: "v1",
  tenantId: "t1",
  brand: "Chevrolet",
  model: "Onix",
  version: "1.0 Turbo Premier",
  yearManufacture: 2022,
  yearModel: 2023,
  mileageKm: 35000,
  priceCents: 8990000,
  priceOnRequest: false,
  transmission: "automatico",
  fuel: "flex",
  bodyType: "hatch",
  color: "Branco",
  doors: 4,
  options: ["ar-condicionado", "ar-digital", "direcao-eletrica", "abs", "4x4", "engate"],
  description: "  Único dono, revisões na concessionária.  ",
  status: "available",
} as unknown as Vehicle;

const seller: SellerInfo = {
  name: "Gabriel Braga Andrade LTDA",
  email: "loja@exemplo.com.br",
  whatsapp: "+55 (27) 99999-1234",
  street: "Avenida Jurucê",
  number: "436",
  district: "Moema",
  city: "São Paulo",
  state: "SP",
  zip: "04080-011",
};

const location = {
  stateId: "TUxCUFNBT085N2E4",
  cityId: "TUxCQ1NQLTkxMjE",
  key: "sao paulo|sao paulo",
};

describe("itemTitle", () => {
  it("marca, modelo, versão e ano; cabe em 60", () => {
    expect(itemTitle(vehicle)).toBe("Chevrolet Onix 1.0 Turbo Premier 2023");
  });

  it("versão longa demais sai; marca, modelo e ano ficam", () => {
    const long = { ...vehicle, version: "Uma versão com um nome absurdamente comprido demais" };
    expect(itemTitle(long)).toBe("Chevrolet Onix 2023");
  });
});

describe("itemAttributes", () => {
  it("traduz os valores nossos para os que o ML reconhece", () => {
    const attributes = Object.fromEntries(
      itemAttributes(vehicle).map((attribute) => [attribute.id, attribute.value_name]),
    );
    expect(attributes).toMatchObject({
      BRAND: "Chevrolet",
      MODEL: "Onix",
      VEHICLE_YEAR: "2023",
      KILOMETERS: "35000 km",
      TRIM: "1.0 Turbo Premier",
      DOORS: "4",
      COLOR: "Branco",
      FUEL_TYPE: "Gasolina e álcool",
      TRANSMISSION: "Automática",
      VEHICLE_BODY_TYPE: "Hatchback",
      STEERING: "Elétrica",
      TRACTION_CONTROL: "4x4",
      HAS_ABS_BRAKES: "Sim",
      ITEM_CONDITION: "Usado",
    });
  });

  it("dois opcionais que viram o mesmo atributo não o repetem", () => {
    const ids = itemAttributes(vehicle).map((attribute) => attribute.id);
    expect(ids.filter((id) => id === "HAS_AIR_CONDITIONING")).toHaveLength(1);
    // engate não tem atributo documentado: fica de fora em vez de virar chute
    expect(ids).not.toContain("HAS_TOW_HITCH");
  });
});

describe("sellerContact", () => {
  it("separa DDD e número, e repete no WhatsApp como o ML exige", () => {
    expect(sellerContact(seller)).toEqual({
      contact: "Gabriel Braga Andrade LTDA",
      email: "loja@exemplo.com.br",
      country_code: "55",
      area_code: "27",
      phone: "999991234",
      country_code2: "55",
      phone2: "27999991234",
    });
  });

  it("sem telefone manda só o nome — o ML usa o e-mail da conta", () => {
    expect(sellerContact({ ...seller, whatsapp: null, email: null })).toEqual({
      contact: "Gabriel Braga Andrade LTDA",
    });
  });
});

describe("itemPayload", () => {
  const input = {
    vehicle,
    pictureUrls: ["https://x/1.jpg", "https://x/2.jpg"],
    seller,
    location,
    listingTypeId: "free",
  };

  it("monta o classificado como a doc do ML descreve", () => {
    const payload = itemPayload(input);
    expect(payload).toMatchObject({
      title: "Chevrolet Onix 1.0 Turbo Premier 2023",
      category_id: "MLB1744",
      price: 89900,
      currency_id: "BRL",
      available_quantity: 1,
      buying_mode: "classified",
      listing_type_id: "free",
      condition: "used",
      pictures: [{ source: "https://x/1.jpg" }, { source: "https://x/2.jpg" }],
      description: { plain_text: "Único dono, revisões na concessionária." },
      location: {
        address_line: "Avenida Jurucê, 436",
        zip_code: "04080011",
        city: { id: location.cityId },
        state: { id: location.stateId },
        country: { id: "BR" },
      },
    });
  });

  it("a atualização só leva o que um anúncio no ar aceita mudar", () => {
    expect(Object.keys(updatePayload(input)).sort()).toEqual(["attributes", "pictures", "price"]);
  });
});

describe("stateName", () => {
  it("UF vira o nome que o ML lista", () => {
    expect(stateName("sp")).toBe("São Paulo");
    expect(stateName("Espírito Santo")).toBe("Espírito Santo");
  });
});

/* ------------------------------------------------------------------------ */

function fetcherReturning(status: number, body: unknown) {
  return vi.fn(
    async () => new Response(JSON.stringify(body), { status }),
  ) as unknown as typeof fetch & {
    mock: { calls: [string, RequestInit][] };
  };
}

describe("MercadoLivreClient", () => {
  it("repassa as causas do ML na mensagem, que é o que a revenda precisa ler", async () => {
    const fetcher = fetcherReturning(400, {
      message: "Validation error",
      error: "validation_error",
      cause: [
        { code: "item.attributes.missing_required", message: "Attribute DOORS is required" },
        { code: "item.pictures.invalid", message: "Invalid picture" },
      ],
    });
    const client = new MercadoLivreClient("tok", fetcher);
    await expect(client.closeItem("MLB1")).rejects.toMatchObject({
      status: 502,
      message: "Validation error: Attribute DOORS is required; Invalid picture",
    });
  });

  it("manda o token e encerra com status closed", async () => {
    const fetcher = fetcherReturning(200, { id: "MLB1", status: "closed" });
    await new MercadoLivreClient("tok", fetcher).closeItem("MLB1");
    const [url, init] = fetcher.mock.calls[0];
    expect(url).toBe("https://api.mercadolibre.com/items/MLB1");
    expect(init.method).toBe("PUT");
    expect((init.headers as Record<string, string>).authorization).toBe("Bearer tok");
    expect(JSON.parse(init.body as string)).toEqual({ status: "closed" });
  });
});

describe("refreshTokens", () => {
  it("devolve o par novo com validade calculada", async () => {
    const fetcher = fetcherReturning(200, {
      access_token: "novo",
      refresh_token: "refresh-novo",
      expires_in: 21600,
      user_id: 987,
    });
    const before = Date.now();
    const tokens = await refreshTokens({ clientId: "id", clientSecret: "s" }, "antigo", fetcher);
    expect(tokens.accessToken).toBe("novo");
    expect(tokens.refreshToken).toBe("refresh-novo");
    expect(tokens.externalUserId).toBe("987");
    expect(Date.parse(tokens.expiresAt!)).toBeGreaterThanOrEqual(before + 21600 * 1000);

    const body = fetcher.mock.calls[0][1].body as URLSearchParams;
    expect(body.get("grant_type")).toBe("refresh_token");
    expect(body.get("refresh_token")).toBe("antigo");
  });

  it("recusa como 401 para a conexão inteira parar, não um carro só", async () => {
    const fetcher = fetcherReturning(400, { error: "invalid_grant", message: "refresh expired" });
    await expect(
      refreshTokens({ clientId: "id", clientSecret: "s" }, "antigo", fetcher),
    ).rejects.toMatchObject({ status: 401 });
  });
});
