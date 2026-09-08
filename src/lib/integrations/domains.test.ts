import { describe, expect, it } from "vitest";
import {
  VERCEL_APEX_IP,
  VERCEL_CNAME_TARGET,
  dnsInstructionsFor,
  dnsRecordName,
  domainVerdict,
  isApexDomain,
  normalizeDomain,
  suggestedPair,
} from "./domains";

function ok(input: string): string {
  const result = normalizeDomain(input);
  if (!result.ok) throw new Error(`esperava aceitar "${input}": ${result.reason}`);
  return result.domain;
}

describe("normalizeDomain", () => {
  it("aceita o endereço limpo", () => {
    expect(ok("revenda.com.br")).toBe("revenda.com.br");
  });

  it("tira o que vem junto do copiar e colar", () => {
    // é assim que o endereço chega de verdade: da barra do navegador
    expect(ok("https://revenda.com.br/")).toBe("revenda.com.br");
    expect(ok("http://www.revenda.com.br/estoque?x=1")).toBe("www.revenda.com.br");
    expect(ok("  REVENDA.COM.BR  ")).toBe("revenda.com.br");
    expect(ok("revenda.com.br:443")).toBe("revenda.com.br");
    expect(ok("revenda.com.br.")).toBe("revenda.com.br");
  });

  it("não come o www — é outro endereço, com outro registro", () => {
    expect(ok("www.revenda.com.br")).toBe("www.revenda.com.br");
  });

  it("recusa o que não é endereço", () => {
    expect(normalizeDomain("").ok).toBe(false);
    expect(normalizeDomain("revenda").ok).toBe(false);
    expect(normalizeDomain("minha revenda.com.br").ok).toBe(false);
    expect(normalizeDomain("revenda..com.br").ok).toBe(false);
    expect(normalizeDomain("reven_da.com.br").ok).toBe(false);
    expect(normalizeDomain("-revenda.com.br").ok).toBe(false);
  });

  it("recusa curinga, que pareceria funcionar e não é o que se quer aqui", () => {
    const result = normalizeDomain("*.revenda.com.br");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/[Cc]uringa/);
  });

  it("recusa rótulo acima de 63 caracteres", () => {
    expect(normalizeDomain(`${"a".repeat(64)}.com.br`).ok).toBe(false);
    expect(normalizeDomain(`${"a".repeat(63)}.com.br`).ok).toBe(true);
  });
});

describe("isApexDomain", () => {
  /**
   * O caso que quebra quem conta rótulos.
   *
   * `revenda.com.br` tem três partes e é raiz. Tratar como subdomínio faz a
   * tela pedir um CNAME no apex — inválido, recusado pela maioria dos
   * provedores, e quando aceito derruba o e-mail da revenda junto.
   */
  it("reconhece .com.br como raiz, mesmo com três rótulos", () => {
    expect(isApexDomain("revenda.com.br")).toBe(true);
    expect(isApexDomain("revenda.net.br")).toBe(true);
    expect(isApexDomain("revenda.co.uk")).toBe(true);
  });

  it("reconhece a raiz de dois rótulos", () => {
    expect(isApexDomain("revenda.com")).toBe(true);
    expect(isApexDomain("revenda.app")).toBe(true);
  });

  it("reconhece subdomínio", () => {
    expect(isApexDomain("www.revenda.com.br")).toBe(false);
    expect(isApexDomain("www.revenda.com")).toBe(false);
    expect(isApexDomain("seminovos.revenda.com.br")).toBe(false);
    expect(isApexDomain("a.b.revenda.com.br")).toBe(false);
  });
});

describe("dnsRecordName", () => {
  it("usa @ na raiz", () => {
    expect(dnsRecordName("revenda.com.br")).toBe("@");
    expect(dnsRecordName("revenda.com")).toBe("@");
  });

  it("usa só o rótulo do subdomínio, não o endereço inteiro", () => {
    // quem digita o host completo no campo "nome" cria www.revenda.com.br.revenda.com.br
    expect(dnsRecordName("www.revenda.com.br")).toBe("www");
    expect(dnsRecordName("www.revenda.com")).toBe("www");
    expect(dnsRecordName("seminovos.revenda.com.br")).toBe("seminovos");
    expect(dnsRecordName("a.b.revenda.com.br")).toBe("a.b");
  });
});

describe("dnsInstructionsFor", () => {
  it("manda registro A na raiz, porque CNAME no apex é inválido", () => {
    expect(dnsInstructionsFor("revenda.com.br")).toEqual({
      type: "A",
      name: "@",
      value: VERCEL_APEX_IP,
    });
  });

  it("manda CNAME no subdomínio, que sobrevive a troca de IP", () => {
    expect(dnsInstructionsFor("www.revenda.com.br")).toEqual({
      type: "CNAME",
      name: "www",
      value: VERCEL_CNAME_TARGET,
    });
  });
});

describe("suggestedPair", () => {
  it("sugere o www a partir da raiz", () => {
    expect(suggestedPair("revenda.com.br")).toBe("www.revenda.com.br");
  });

  it("sugere a raiz a partir do www", () => {
    expect(suggestedPair("www.revenda.com.br")).toBe("revenda.com.br");
  });

  it("não sugere par para subdomínio qualquer", () => {
    expect(suggestedPair("seminovos.revenda.com.br")).toBeNull();
  });
});

describe("domainVerdict", () => {
  const dominio = "revenda.com.br";

  it("não verificado pede o registro, mesmo sem a Vercel dizer qual", () => {
    const verdict = domainVerdict(dominio, { verified: false, misconfigured: true, missing: [] });
    expect(verdict.status).toBe("pendente");
    // sem instrução a tela mostraria "faça algo" sem dizer o quê
    expect(verdict.pendingRecords).toEqual([{ type: "A", name: "@", value: VERCEL_APEX_IP }]);
  });

  it("prefere o registro que a Vercel exigiu ao nosso padrão", () => {
    const txt = { type: "TXT" as const, name: "_vercel", value: "vc-domain-verify=abc" };
    const verdict = domainVerdict(dominio, {
      verified: false,
      misconfigured: true,
      missing: [txt],
    });
    expect(verdict.pendingRecords).toEqual([txt]);
  });

  it("verificado mas apontando para outro lugar continua pendente", () => {
    const verdict = domainVerdict(dominio, { verified: true, misconfigured: true, missing: [] });
    expect(verdict.status).toBe("pendente");
    expect(verdict.message).toMatch(/aponta/);
  });

  it("verificado e configurado é o único caso de no ar", () => {
    const verdict = domainVerdict(dominio, { verified: true, misconfigured: false, missing: [] });
    expect(verdict.status).toBe("ativo");
    expect(verdict.pendingRecords).toEqual([]);
  });
});
