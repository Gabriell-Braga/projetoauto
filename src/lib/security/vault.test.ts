import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { generateVaultKey, isVaultConfigured, maskSecret, open, seal } from "./vault";

const original = process.env.VAULT_KEY;

beforeEach(() => {
  process.env.VAULT_KEY = generateVaultKey();
});

afterEach(() => {
  if (original === undefined) delete process.env.VAULT_KEY;
  else process.env.VAULT_KEY = original;
});

describe("cofre de credenciais", () => {
  it("devolve o mesmo texto depois de cifrar e decifrar", async () => {
    const senha = "senha-do-portal-123";
    expect(await open(await seal(senha))).toBe(senha);
  });

  it("guarda acentos e símbolos sem corromper", async () => {
    const valor = 'Senha çom ãcento & símbolo "aspas" 日本';
    expect(await open(await seal(valor))).toBe(valor);
  });

  it("nunca devolve o texto original no que fica gravado", async () => {
    const senha = "minha-senha-secreta";
    const guardado = await seal(senha);
    expect(guardado).not.toContain(senha);
    expect(guardado.startsWith("v1:")).toBe(true);
  });

  it("cifra o mesmo texto de formas diferentes a cada vez", async () => {
    // IV repetido em AES-GCM quebra a confidencialidade; dois selos iguais
    // denunciariam que o IV está fixo
    const a = await seal("mesmo-valor");
    const b = await seal("mesmo-valor");
    expect(a).not.toBe(b);
    expect(await open(a)).toBe(await open(b));
  });

  it("recusa credencial adulterada em vez de devolver lixo", async () => {
    const guardado = await seal("senha");
    const [version, iv, data] = guardado.split(":");
    const adulterado = [version, iv, data.slice(0, -4) + "AAAA"].join(":");
    await expect(open(adulterado)).rejects.toThrow();
  });

  it("recusa formato desconhecido", async () => {
    await expect(open("texto-solto")).rejects.toThrow(/formato desconhecido/i);
  });

  it("recusa guardar quando não há chave mestra", async () => {
    // falha barulhenta é melhor do que gravar senha de portal em texto puro
    delete process.env.VAULT_KEY;
    expect(isVaultConfigured()).toBe(false);
    await expect(seal("senha")).rejects.toThrow(/VAULT_KEY/);
  });

  it("recusa chave mestra do tamanho errado", async () => {
    process.env.VAULT_KEY = btoa("curta demais");
    await expect(seal("senha")).rejects.toThrow(/32 bytes/);
  });

  it("não decifra com outra chave", async () => {
    const guardado = await seal("senha");
    process.env.VAULT_KEY = generateVaultKey();
    await expect(open(guardado)).rejects.toThrow();
  });
});

describe("máscara de exibição", () => {
  it("mostra o suficiente para reconhecer, sem revelar", () => {
    const mascarado = maskSecret("abcdefghijklmnop");
    expect(mascarado.startsWith("abc")).toBe(true);
    expect(mascarado.endsWith("op")).toBe(true);
    expect(mascarado).not.toContain("defghijklmn");
  });

  it("esconde por inteiro o segredo curto", () => {
    // mostrar dois caracteres de uma senha de seis é entregar um terço dela
    expect(maskSecret("abc123")).toBe("••••••••");
    expect(maskSecret("")).toBe("••••••••");
  });
});
