import { describe, expect, it } from "vitest";
import { parseNotification } from "./mercadolivre";

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
