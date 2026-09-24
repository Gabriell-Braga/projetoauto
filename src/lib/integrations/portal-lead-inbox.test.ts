import { beforeAll, describe, expect, it } from "vitest";
import { leadInboxToken, tenantFromLeadToken } from "./portal-lead-inbox";

const TENANT = "11111111-2222-3333-4444-555555555555";
const OUTRO = "99999999-8888-7777-6666-555555555555";

beforeAll(() => {
  process.env.AUTH_SECRET = "segredo-de-teste-para-assinar-a-url-de-leads";
});

describe("token da URL de leads", () => {
  it("volta para a revenda que o gerou", async () => {
    const token = await leadInboxToken(TENANT, "olx");
    expect(await tenantFromLeadToken(token, "olx")).toBe(TENANT);
  });

  it("é estável: a tela pode mostrar o mesmo endereço amanhã", async () => {
    expect(await leadInboxToken(TENANT, "olx")).toBe(await leadInboxToken(TENANT, "olx"));
  });

  /*
   * Um token por portal: quem tem o da OLX não cria lead como se fosse do
   * Webmotors. Assim o endereço cadastrado num portal não vale no outro.
   */
  it("não vale em outro portal", async () => {
    const token = await leadInboxToken(TENANT, "olx");
    expect(await tenantFromLeadToken(token, "webmotors")).toBeNull();
  });

  it("não aceita a revenda trocada no começo do token", async () => {
    const token = await leadInboxToken(TENANT, "olx");
    const assinatura = token.slice(token.indexOf(".") + 1);
    expect(await tenantFromLeadToken(`${OUTRO}.${assinatura}`, "olx")).toBeNull();
  });

  it("não aceita assinatura adulterada nem lixo", async () => {
    const token = await leadInboxToken(TENANT, "olx");
    const trocado = token.slice(0, -1) + (token.endsWith("A") ? "B" : "A");
    expect(await tenantFromLeadToken(trocado, "olx")).toBeNull();
    expect(await tenantFromLeadToken(TENANT, "olx")).toBeNull();
    expect(await tenantFromLeadToken("", "olx")).toBeNull();
    expect(await tenantFromLeadToken(`.${"x".repeat(43)}`, "olx")).toBeNull();
  });
});
