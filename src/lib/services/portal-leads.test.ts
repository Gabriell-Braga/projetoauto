import { describe, expect, it } from "vitest";
import { mercadoLivreLeadKey, questionResource } from "./portal-leads";

describe("questionResource", () => {
  it("aceita o caminho de pergunta que o ML manda", () => {
    expect(questionResource("/questions/12345678")).toBe("/questions/12345678");
  });

  /*
   * O caminho vem do aviso do portal e vira chamada autenticada com o token
   * da revenda. Aceitar qualquer coisa deixaria um aviso forjado escolher o
   * que buscamos na conta dela.
   */
  it("recusa caminho que nao seja de pergunta", () => {
    expect(questionResource("/users/42")).toBeNull();
    expect(questionResource("/questions/12/../../users/42")).toBeNull();
    expect(questionResource("https://api.mercadolibre.com/questions/12")).toBeNull();
    expect(questionResource("/questions/")).toBeNull();
  });
});

describe("mercadoLivreLeadKey", () => {
  const pergunta = {
    id: "1",
    itemId: "MLB123",
    text: "Aceita troca?",
    fromUserId: "4242",
    createdAt: null,
    answered: false,
  };

  it("identifica o lead por anuncio e comprador, nao por pergunta", () => {
    expect(mercadoLivreLeadKey(pergunta)).toBe("mercadolivre:MLB123:4242");
    // segunda pergunta da mesma pessoa no mesmo carro: mesma chave, mesmo lead
    expect(mercadoLivreLeadKey({ ...pergunta, id: "2" })).toBe("mercadolivre:MLB123:4242");
  });

  it("separa compradores diferentes e anuncios diferentes", () => {
    expect(mercadoLivreLeadKey({ ...pergunta, fromUserId: "9" })).toBe("mercadolivre:MLB123:9");
    expect(mercadoLivreLeadKey({ ...pergunta, itemId: "MLB999" })).toBe("mercadolivre:MLB999:4242");
  });
});
