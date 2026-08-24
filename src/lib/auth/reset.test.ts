import { describe, expect, it } from "vitest";
import { RESET_TTL_MINUTES, generateResetToken, hashResetToken, resetExpiresAt } from "./reset";

describe("token de redefinição", () => {
  it("gera token longo e url-safe", () => {
    const token = generateResetToken();
    expect(token.length).toBeGreaterThanOrEqual(40);
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("não repete", () => {
    const values = new Set(Array.from({ length: 50 }, () => generateResetToken()));
    expect(values.size).toBe(50);
  });

  it("o hash não permite voltar ao token", async () => {
    const token = generateResetToken();
    const hash = await hashResetToken(token);
    expect(hash).toHaveLength(64);
    expect(hash).not.toContain(token);
  });

  it("hash é determinístico e distingue tokens", async () => {
    const token = generateResetToken();
    expect(await hashResetToken(token)).toBe(await hashResetToken(token));
    expect(await hashResetToken(token)).not.toBe(await hashResetToken(generateResetToken()));
  });

  it("expira dentro da janela declarada", () => {
    const now = new Date(Date.UTC(2026, 7, 24, 12, 0, 0));
    const expires = resetExpiresAt(now);
    expect(expires.getTime() - now.getTime()).toBe(RESET_TTL_MINUTES * 60 * 1000);
  });
});
