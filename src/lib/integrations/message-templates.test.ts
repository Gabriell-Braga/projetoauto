import { describe, expect, it } from "vitest";
import {
  DEFAULT_TEMPLATES,
  firstName,
  renderTemplate,
  unknownVariables,
  whatsappLink,
} from "./message-templates";

describe("preenchimento do modelo", () => {
  it("troca as variáveis pelos dados do lead", () => {
    const texto = renderTemplate("Olá {{primeiro_nome}}, o {{veiculo}} está disponível.", {
      primeiro_nome: "Ana",
      veiculo: "Onix 1.0",
    });
    expect(texto).toBe("Olá Ana, o Onix 1.0 está disponível.");
  });

  it("tolera espaços dentro das chaves", () => {
    expect(renderTemplate("Oi {{ primeiro_nome }}", { primeiro_nome: "Ana" })).toBe("Oi Ana");
  });

  it("não deixa a variável crua chegar ao cliente", () => {
    // "Olá {{primeiro_nome}}" no WhatsApp do cliente é pior do que "Olá"
    const texto = renderTemplate("Olá {{primeiro_nome}}, tudo bem?", {});
    expect(texto).not.toContain("{{");
    expect(texto).toBe("Olá, tudo bem?");
  });

  it("apaga variável que não existe, em vez de exibi-la", () => {
    const texto = renderTemplate("Oi {{inventada}}, tudo bem?", { nome: "Ana" });
    expect(texto).toBe("Oi, tudo bem?");
  });

  it("não deixa espaço duplo onde a variável sumiu", () => {
    expect(renderTemplate("O {{veiculo}} chegou", {})).toBe("O chegou");
  });

  it("não deixa espaço antes da pontuação", () => {
    expect(renderTemplate("Olá {{primeiro_nome}}!", {})).toBe("Olá!");
  });

  it("preserva quebras de linha do texto escrito", () => {
    const texto = renderTemplate("Linha 1\nLinha 2 com {{veiculo}}", { veiculo: "Onix" });
    expect(texto).toBe("Linha 1\nLinha 2 com Onix");
  });

  it("trata valor vazio como ausente", () => {
    expect(renderTemplate("Oi {{primeiro_nome}}!", { primeiro_nome: "" })).toBe("Oi!");
    expect(renderTemplate("Oi {{primeiro_nome}}!", { primeiro_nome: null })).toBe("Oi!");
  });
});

describe("primeiro nome", () => {
  it("pega só a primeira palavra", () => {
    expect(firstName("Ana Maria de Souza")).toBe("Ana");
  });

  it("aguenta espaços sobrando", () => {
    expect(firstName("  Bruno   Alves ")).toBe("Bruno");
  });

  it("devolve vazio para nome vazio", () => {
    expect(firstName("")).toBe("");
  });
});

describe("variáveis desconhecidas", () => {
  it("acusa erro de digitação de quem escreveu o modelo", () => {
    expect(unknownVariables("Oi {{primeiro_nome}}, o {{carro}} chegou")).toEqual(["carro"]);
  });

  it("não acusa nada num modelo correto", () => {
    for (const template of DEFAULT_TEMPLATES) {
      expect(unknownVariables(template.body), template.name).toEqual([]);
    }
  });

  it("não repete a mesma variável duas vezes", () => {
    expect(unknownVariables("{{errada}} e {{errada}}")).toEqual(["errada"]);
  });
});

describe("link do WhatsApp", () => {
  it("acrescenta o código do país", () => {
    // sem o 55 o link abre uma conversa vazia
    expect(whatsappLink("11999998888", "oi")).toContain("wa.me/5511999998888");
  });

  it("não duplica o país quando já veio", () => {
    expect(whatsappLink("5511999998888", "oi")).toContain("wa.me/5511999998888");
  });

  it("ignora máscara do telefone", () => {
    expect(whatsappLink("(11) 99999-8888", "oi")).toContain("wa.me/5511999998888");
  });

  it("codifica a mensagem, inclusive acento e quebra de linha", () => {
    const link = whatsappLink("11999998888", "Olá!\nTudo bem?");
    expect(link).toContain("text=Ol%C3%A1!%0ATudo%20bem%3F");
  });
});
