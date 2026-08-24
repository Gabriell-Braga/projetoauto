import { describe, expect, it } from "vitest";
import {
  generateSalt,
  generateTemporaryPassword,
  hashPassword,
  verifyPassword,
} from "./password";

describe("hash de senha (PBKDF2 via Web Crypto)", () => {
  it("aceita a senha correta", async () => {
    const { hash, salt } = await hashPassword("senhaForte123");
    await expect(verifyPassword("senhaForte123", hash, salt)).resolves.toBe(true);
  });

  it("recusa a senha errada", async () => {
    const { hash, salt } = await hashPassword("senhaForte123");
    await expect(verifyPassword("senhaForte124", hash, salt)).resolves.toBe(false);
  });

  it("não guarda a senha em claro", async () => {
    const { hash } = await hashPassword("senhaForte123");
    expect(hash).not.toContain("senhaForte123");
  });

  it("mesma senha com salts diferentes gera hashes diferentes", async () => {
    const a = await hashPassword("mesmaSenha");
    const b = await hashPassword("mesmaSenha");
    expect(a.salt).not.toBe(b.salt);
    expect(a.hash).not.toBe(b.hash);
  });

  it("é determinístico com o mesmo salt", async () => {
    const salt = generateSalt();
    const a = await hashPassword("mesmaSenha", salt);
    const b = await hashPassword("mesmaSenha", salt);
    expect(a.hash).toBe(b.hash);
  });

  it("salt corrompido não derruba a verificação", async () => {
    const { hash } = await hashPassword("senhaForte123");
    await expect(verifyPassword("senhaForte123", hash, "$$$nao-e-base64$$$")).resolves.toBe(false);
  });
});

describe("senha provisória", () => {
  it("respeita o tamanho e evita caracteres ambíguos", () => {
    const password = generateTemporaryPassword(16);
    expect(password).toHaveLength(16);
    expect(password).not.toMatch(/[0O1lI]/);
  });

  it("não repete entre chamadas", () => {
    const values = new Set(Array.from({ length: 20 }, () => generateTemporaryPassword()));
    expect(values.size).toBe(20);
  });
});
