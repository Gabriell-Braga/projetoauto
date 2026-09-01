import { describe, expect, it } from "vitest";
import {
  buildStockJson,
  buildStockXml,
  escapeXml,
  formatFeedPrice,
  type FeedStore,
  type FeedVehicle,
} from "./stock-feed";

const store: FeedStore = {
  name: "Revenda Teste",
  slug: "revenda-teste",
  phone: "1133334444",
  whatsapp: "11999998888",
  email: "contato@revenda.com.br",
  city: "São Paulo",
  state: "SP",
};

function vehicle(overrides: Partial<FeedVehicle> = {}): FeedVehicle {
  return {
    id: "abc",
    slug: "onix-2022",
    brand: "Chevrolet",
    model: "Onix",
    version: "1.0 LT",
    yearManufacture: 2021,
    yearModel: 2022,
    mileageKm: 34000,
    priceCents: 7_990_000,
    priceOnRequest: false,
    transmission: "manual",
    fuel: "flex",
    bodyType: "hatch",
    color: "Prata",
    doors: 4,
    licensePlateEnd: "7",
    options: ["Ar-condicionado"],
    description: "Único dono",
    status: "available",
    fipeCode: "004321-0",
    photos: ["https://exemplo.com/foto.jpg"],
    updatedAt: new Date("2026-09-01T12:00:00.000Z"),
    ...overrides,
  };
}

describe("escape de XML", () => {
  it("escapa os cinco caracteres que quebram o documento", () => {
    expect(escapeXml(`Ar & som <b> "top" 'novo'`)).toBe(
      "Ar &amp; som &lt;b&gt; &quot;top&quot; &apos;novo&apos;",
    );
  });

  it("não escapa duas vezes o & que acabou de criar", () => {
    // trocar & por &amp; depois de < viraria &amp;lt;
    expect(escapeXml("<")).toBe("&lt;");
    expect(escapeXml("&")).toBe("&amp;");
  });

  it("remove caracteres de controle que vêm de texto colado", () => {
    const sujo = `Carro${String.fromCharCode(0)} novo${String.fromCharCode(7)}`;
    expect(escapeXml(sujo)).toBe("Carro novo");
  });

  it("preserva quebra de linha e tabulação, que são válidas", () => {
    expect(escapeXml("linha1\nlinha2\tfim")).toBe("linha1\nlinha2\tfim");
  });

  it("preserva acentos", () => {
    expect(escapeXml("Único dono, revisões em dia")).toBe("Único dono, revisões em dia");
  });
});

describe("preço no feed", () => {
  it("usa ponto decimal e duas casas", () => {
    expect(formatFeedPrice(7_990_000)).toBe("79900.00");
    expect(formatFeedPrice(7_990_050)).toBe("79900.50");
  });
});

describe("XML do estoque", () => {
  it("gera um documento com cabeçalho e total", () => {
    const xml = buildStockXml(store, [vehicle()], new Date("2026-09-01T12:00:00.000Z"));
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(xml).toContain("<total>1</total>");
    expect(xml).toContain("<marca>Chevrolet</marca>");
    expect(xml).toContain("<preco>79900.00</preco>");
  });

  it("omite o preço de quem está sob consulta, em vez de mandar zero", () => {
    // zero num feed é lido como carro de graça
    const xml = buildStockXml(store, [vehicle({ priceOnRequest: true })], new Date());
    expect(xml).not.toContain("<preco>");
    expect(xml).toContain("<preco_sob_consulta>true</preco_sob_consulta>");
  });

  it("omite campo vazio em vez de emitir tag sem conteúdo", () => {
    const xml = buildStockXml(store, [vehicle({ version: null, color: null })], new Date());
    expect(xml).not.toContain("<versao>");
    expect(xml).not.toContain("<cor>");
  });

  it("sobrevive a descrição com & e <", () => {
    const xml = buildStockXml(
      store,
      [vehicle({ description: 'Som & rodas <17"> originais' })],
      new Date(),
    );
    expect(xml).toContain("Som &amp; rodas &lt;17&quot;&gt; originais");
    // nenhum & solto sobra para invalidar o documento
    expect(/&(?!amp;|lt;|gt;|quot;|apos;)/.test(xml)).toBe(false);
  });

  it("estoque vazio ainda gera documento válido", () => {
    const xml = buildStockXml(store, [], new Date());
    expect(xml).toContain("<total>0</total>");
    expect(xml).toContain("</estoque>");
  });
});

describe("JSON do estoque", () => {
  it("manda preço numérico e nulo sob consulta", () => {
    const feed = buildStockJson(store, [vehicle(), vehicle({ priceOnRequest: true })], new Date());
    const items = feed.veiculos as { preco: number | null; precoSobConsulta: boolean }[];
    expect(items[0].preco).toBe(79900);
    expect(items[1].preco).toBeNull();
    expect(items[1].precoSobConsulta).toBe(true);
  });

  it("é serializável sem perder nada", () => {
    const feed = buildStockJson(store, [vehicle()], new Date());
    expect(() => JSON.stringify(feed)).not.toThrow();
  });
});
