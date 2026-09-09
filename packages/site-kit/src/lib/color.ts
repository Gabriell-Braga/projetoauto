/**
 * Cores derivadas da cor da marca.
 *
 * A revenda escolhe UMA cor no painel. Tudo que é aquela cor num outro estado
 * — hover, pressionado — sai daqui, calculado. Guardar um segundo campo para o
 * hover é o que produzia o defeito que o Gabriel viu: o desenho do Marketplace
 * nasce verde, a revenda pintou o botão de azul, e o hover continuou verde
 * porque ninguém nunca mexeu no segundo campo. Cor que precisa acompanhar
 * outra não se guarda: se deriva.
 */

/** Aceita #RGB e #RRGGBB. Devolve null para qualquer outra coisa. */
function parseHex(color: string): { r: number; g: number; b: number } | null {
  const hex = color.trim().replace(/^#/, "");
  const cheio =
    hex.length === 3
      ? hex
          .split("")
          .map((c) => c + c)
          .join("")
      : hex;
  if (!/^[0-9a-fA-F]{6}$/.test(cheio)) return null;
  return {
    r: parseInt(cheio.slice(0, 2), 16),
    g: parseInt(cheio.slice(2, 4), 16),
    b: parseInt(cheio.slice(4, 6), 16),
  };
}

function toHex({ r, g, b }: { r: number; g: number; b: number }): string {
  const dois = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${dois(r)}${dois(g)}${dois(b)}`;
}

/**
 * Luminância percebida, de 0 (preto) a 1 (branco).
 *
 * Os pesos não são iguais porque o olho não vê as três cores com a mesma
 * força: verde pesa três vezes mais que vermelho, e azul quase nada. Sem isso,
 * um azul escuro e um amarelo vivo dariam o mesmo número.
 */
function luminancia({ r, g, b }: { r: number; g: number; b: number }): number {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

/**
 * A cor da marca um passo adiante, para hover e estado pressionado.
 *
 * Escurece — que é o gesto esperado — mas CLAREIA quando a cor já é escura.
 * Uma revenda de marca preta escolhe preto: escurecer o preto não muda nada na
 * tela, e o botão ficaria sem resposta ao mouse. É o único caso em que inverter
 * o sentido é o certo.
 *
 * Entrada que não é hexadecimal volta como está: melhor um hover igual à cor
 * normal do que um botão que some.
 */
export function hoverShade(primary: string): string {
  const rgb = parseHex(primary);
  if (!rgb) return primary;

  const escuro = luminancia(rgb) < 0.22;
  const alvo = escuro ? 255 : 0;
  const forca = escuro ? 0.18 : 0.14;

  return toHex({
    r: rgb.r + (alvo - rgb.r) * forca,
    g: rgb.g + (alvo - rgb.g) * forca,
    b: rgb.b + (alvo - rgb.b) * forca,
  });
}
