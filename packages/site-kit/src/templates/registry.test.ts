import { describe, expect, it } from "vitest";
import { DEFAULT_TEMPLATE_ID, TEMPLATE_MANIFESTS } from "./manifests";
import { TEMPLATE_REGISTRY, assertRegistryIntegrity, getTemplate } from "./registry";

/**
 * Aposentar um template é a operação perigosa deste diretório.
 *
 * `getTemplate` cai no padrão quando não encontra o id — o que é a decisão
 * certa em produção, porque site fora do ar é pior que site com a aparência
 * errada. Mas isso significa que remover um template NÃO quebra nada de forma
 * visível: a revenda que usava ele simplesmente amanhece com outro desenho, e
 * ninguém fica sabendo até o cliente ligar.
 *
 * Como o plano é substituir os cinco templates atuais pelos desenhados no
 * Figma, estes testes existem para que a remoção seja um ato consciente: quem
 * apagar o código sem apagar o manifesto — ou sem migrar as revendas — vê o
 * teste vermelho antes do deploy.
 */
describe("registro de templates", () => {
  it("todo manifesto tem implementação", () => {
    // é este o caso que o fallback esconde: manifesto oferecido no painel,
    // escolhido pela revenda, e sem código por trás
    expect(assertRegistryIntegrity()).toEqual([]);
  });

  it("toda implementação tem manifesto", () => {
    const ids = new Set(TEMPLATE_MANIFESTS.map((manifest) => manifest.id));
    const orfaos = Object.keys(TEMPLATE_REGISTRY).filter((id) => !ids.has(id));

    expect(
      orfaos,
      `Template sem manifesto não aparece no painel — ninguém consegue escolher: ${orfaos.join(", ")}`,
    ).toEqual([]);
  });

  it("o template padrão existe de verdade", () => {
    // se ele sumir, o fallback do getTemplate devolve undefined e toda página
    // pública quebra de uma vez — não só a das revendas afetadas
    expect(TEMPLATE_REGISTRY[DEFAULT_TEMPLATE_ID]).toBeDefined();
  });

  it("id desconhecido cai no padrão em vez de derrubar o site", () => {
    expect(getTemplate("template-que-nao-existe")).toBe(TEMPLATE_REGISTRY[DEFAULT_TEMPLATE_ID]);
  });

  it("todo template pronto para escolha declara o que dá para customizar", () => {
    // manifesto sem `supports` deixa a aba de identidade sem controle nenhum,
    // e a revenda conclui que o site dela não tem personalização
    const semSuporte = TEMPLATE_MANIFESTS.filter(
      (manifest) => manifest.status === "ready" && manifest.supports.length === 0,
    ).map((manifest) => manifest.id);

    expect(semSuporte).toEqual([]);
  });
});
