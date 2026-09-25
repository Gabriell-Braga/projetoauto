import { describe, expect, it, vi } from "vitest";
import { buildGa4Payload, sendGa4Event } from "./ga4";
import { buildMetaPayload, sendMetaEvent } from "./meta";
import { normalizeEmail, normalizePhone, sha256, splitName } from "./identity";
import type { TrackedEvent } from "./event";

const evento: TrackedEvent = {
  name: "lead",
  eventId: "lead-123",
  occurredAt: new Date("2026-09-25T12:00:00.000Z"),
  value: 149900,
  user: {
    email: "  Ana@Exemplo.COM ",
    phone: "(31) 98888-7777",
    name: "Ana Maria Souza",
    ip: "200.1.2.3",
    userAgent: "Mozilla/5.0",
    fbp: "fb.1.123.456",
    fbc: "fb.1.123.abc",
    ga4ClientId: "111.222",
  },
  content: { id: "veiculo-1", name: "Jeep Compass 2023", brand: "Jeep", model: "Compass" },
  sourceUrl: "https://loja.com.br/veiculo/jeep-compass",
};

describe("normalização antes do hash", () => {
  it("limpa o e-mail: hash de valor sujo não casa com o que a plataforma tem", () => {
    expect(normalizeEmail("  Ana@Exemplo.COM ")).toBe("ana@exemplo.com");
    expect(normalizeEmail("sem-arroba")).toBeNull();
    expect(normalizeEmail(null)).toBeNull();
  });

  /*
   * O país na frente é o erro clássico de CAPI no Brasil: sem o 55 o telefone
   * não bate, e a campanha perde a conversão sem nenhum erro aparecer.
   */
  it("põe o 55 no telefone, e não duplica quando já veio", () => {
    expect(normalizePhone("(31) 98888-7777")).toBe("5531988887777");
    expect(normalizePhone("5531988887777")).toBe("5531988887777");
    expect(normalizePhone("3133330000")).toBe("553133330000");
    expect(normalizePhone("999")).toBeNull();
  });

  it("separa nome e sobrenome em minúsculas, como a Meta pede", () => {
    expect(splitName("Ana Maria Souza")).toEqual({ first: "ana", last: "souza" });
    expect(splitName("Ana")).toEqual({ first: "ana", last: null });
    expect(splitName("  ")).toEqual({ first: null, last: null });
  });

  it("o hash é SHA-256 em hexadecimal", async () => {
    expect(await sha256("ana@exemplo.com")).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("payload da Meta", () => {
  it("manda dado pessoal só com hash, e o resto em claro como a API espera", async () => {
    const payload = await buildMetaPayload(evento, { pixelId: "1", accessToken: "t" });
    const data = payload.data[0];
    const user = data.user_data as Record<string, unknown>;

    expect(data.event_name).toBe("Lead");
    expect(data.event_id).toBe("lead-123");
    expect(data.event_time).toBe(Math.floor(evento.occurredAt!.getTime() / 1000));

    // nada de e-mail ou telefone legível no corpo
    const serializado = JSON.stringify(payload);
    expect(serializado).not.toContain("ana@exemplo.com");
    expect(serializado).not.toContain("988887777");

    expect(user.em).toEqual([await sha256("ana@exemplo.com")]);
    expect(user.ph).toEqual([await sha256("5531988887777")]);
    expect(user.fn).toEqual([await sha256("ana")]);
    // ip, user-agent e cookies do pixel vão em claro: é assim que a Meta pede
    expect(user.client_ip_address).toBe("200.1.2.3");
    expect(user.fbp).toBe("fb.1.123.456");

    expect(data.custom_data).toMatchObject({
      value: 149900,
      currency: "BRL",
      content_ids: ["veiculo-1"],
    });
  });

  it("omite o que não existe em vez de mandar vazio", async () => {
    const payload = await buildMetaPayload(
      { name: "sale", eventId: "s-1" },
      { pixelId: "1", accessToken: "t" },
    );
    const data = payload.data[0];
    expect(data.event_name).toBe("Purchase");
    expect(data.user_data).toEqual({});
    expect(data).not.toHaveProperty("custom_data");
  });

  it("devolve o erro que a Meta explicou, sem lançar", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: { error_user_msg: "Token inválido" } }), {
        status: 400,
      }),
    );
    const result = await sendMetaEvent(evento, { pixelId: "1", accessToken: "t" }, fetcher);
    expect(result).toEqual({ ok: false, error: "Token inválido" });
  });

  it("falha de rede não vira exceção: a conversão se perde, o lead não", async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error("timeout"));
    const result = await sendMetaEvent(evento, { pixelId: "1", accessToken: "t" }, fetcher);
    expect(result).toEqual({ ok: false, error: "timeout" });
  });
});

describe("payload do GA4", () => {
  it("usa o client_id do cookie: é o que gruda a venda na visita original", () => {
    const payload = buildGa4Payload(evento);
    expect(payload.client_id).toBe("111.222");
    expect(payload.events[0].name).toBe("generate_lead");
  });

  it("sem cookie, inventa um id estável em vez de perder o evento", () => {
    const semCookie = buildGa4Payload({ ...evento, user: {} });
    expect(semCookie.client_id).toMatch(/^\d+\.\d+$/);
  });

  it("venda vira purchase com transaction_id — sem ele o GA conta duplicado", () => {
    const payload = buildGa4Payload({ ...evento, name: "sale" });
    expect(payload.events[0].name).toBe("purchase");
    expect(payload.events[0].params).toMatchObject({
      transaction_id: "lead-123",
      value: 149900,
      currency: "BRL",
    });
  });

  it("manda o item para o relatório de produto", () => {
    const params = buildGa4Payload(evento).events[0].params as { items?: unknown[] };
    expect(params.items?.[0]).toMatchObject({
      item_id: "veiculo-1",
      item_name: "Jeep Compass 2023",
      item_brand: "Jeep",
    });
  });

  it("o api_secret vai na URL, não no corpo", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    await sendGa4Event(evento, { measurementId: "G-ABC", apiSecret: "segredo" }, fetcher);

    const [url, init] = fetcher.mock.calls[0];
    expect(url).toContain("measurement_id=G-ABC");
    expect(url).toContain("api_secret=segredo");
    expect(String(init.body)).not.toContain("segredo");
  });
});
