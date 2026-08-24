import { describe, expect, it } from "vitest";
import { RESERVED_SLUGS, billingUpdateSchema, gtmSchema, slugSchema } from "./tenants";

describe("slug da revenda", () => {
  it("aceita slug válido", () => {
    expect(slugSchema.parse("auto-center-silva")).toBe("auto-center-silva");
  });

  it("normaliza para minúsculas", () => {
    expect(slugSchema.parse("Auto-Center")).toBe("auto-center");
  });

  it("recusa caracteres inválidos", () => {
    expect(slugSchema.safeParse("auto center").success).toBe(false);
    expect(slugSchema.safeParse("auto_center").success).toBe(false);
    expect(slugSchema.safeParse("auto--center").success).toBe(false);
    expect(slugSchema.safeParse("-auto").success).toBe(false);
  });

  it("recusa slug curto demais ou longo demais", () => {
    expect(slugSchema.safeParse("ab").success).toBe(false);
    expect(slugSchema.safeParse("a".repeat(41)).success).toBe(false);
  });

  it("bloqueia todos os slugs reservados", () => {
    for (const reserved of RESERVED_SLUGS) {
      expect(slugSchema.safeParse(reserved).success).toBe(false);
    }
  });

  it("bloqueia rotas do app que colidiriam com o site da revenda", () => {
    for (const critical of ["admin", "super-admin", "api", "login", "r"]) {
      expect(RESERVED_SLUGS).toContain(critical);
    }
  });
});

describe("código GTM", () => {
  it("aceita o formato do contêiner", () => {
    expect(gtmSchema.safeParse("GTM-ABC1234").success).toBe(true);
    expect(gtmSchema.safeParse("gtm-abc1234").success).toBe(true);
  });

  it("aceita vazio (herda o da plataforma)", () => {
    expect(gtmSchema.safeParse("").success).toBe(true);
  });

  it("recusa lixo", () => {
    expect(gtmSchema.safeParse("UA-123456").success).toBe(false);
    expect(gtmSchema.safeParse("<script>").success).toBe(false);
  });
});

describe("cobrança", () => {
  it("aceita tolerância dentro do intervalo", () => {
    expect(billingUpdateSchema.parse({ graceDays: 0 }).graceDays).toBe(0);
    expect(billingUpdateSchema.parse({ graceDays: 60 }).graceDays).toBe(60);
  });

  it("recusa tolerância negativa ou absurda", () => {
    expect(billingUpdateSchema.safeParse({ graceDays: -1 }).success).toBe(false);
    expect(billingUpdateSchema.safeParse({ graceDays: 400 }).success).toBe(false);
  });

  it("recusa dia de vencimento fora de 1..28", () => {
    expect(billingUpdateSchema.safeParse({ dueDay: 0 }).success).toBe(false);
    expect(billingUpdateSchema.safeParse({ dueDay: 31 }).success).toBe(false);
  });
});
