/**
 * Placa de veículo brasileira.
 *
 * Convivem dois formatos, e os dois são válidos — o Mercosul não substituiu o
 * antigo, só passou a ser o emitido em placas novas:
 *
 *   antiga    ABC1234   3 letras + 4 dígitos
 *   Mercosul  ABC1D23   3 letras, dígito, letra, 2 dígitos
 *
 * Guardamos SEMPRE normalizada: maiúscula, sem hífen, sem espaço. Assim a
 * busca por placa encontra o veículo independentemente de como a pessoa
 * digitou, e a comparação entre duas placas é uma comparação de texto.
 */

const ANTIGA = /^[A-Z]{3}[0-9]{4}$/;
const MERCOSUL = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/;

export type PlateKind = "antiga" | "mercosul";

/** Comprimento dos dois formatos; serve de `maxLength` no campo. */
export const PLATE_LENGTH = 7;

/**
 * Tira tudo que não é letra ou dígito e sobe para maiúscula.
 *
 * É o que o campo aplica a cada tecla: sem hífen nenhum, de propósito. Máscara
 * que insere separador enquanto se digita briga com o cursor quando a pessoa
 * corrige o meio do texto, e aqui ela nem ajudaria — a placa Mercosul não tem
 * hífen, e até o sétimo caractere não dá para saber qual dos dois formatos a
 * pessoa está digitando.
 */
export function normalizePlate(raw: string | null | undefined): string {
  if (!raw) return "";
  return raw
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, PLATE_LENGTH);
}

/** Qual dos dois formatos, ou `null` quando não é placa válida. */
export function plateKind(raw: string | null | undefined): PlateKind | null {
  const plate = normalizePlate(raw);
  if (ANTIGA.test(plate)) return "antiga";
  if (MERCOSUL.test(plate)) return "mercosul";
  return null;
}

export function isValidPlate(raw: string | null | undefined): boolean {
  return plateKind(raw) !== null;
}

/**
 * Como a placa aparece para uma pessoa.
 *
 * A antiga leva hífen, que é como ela é impressa e lida; a Mercosul não leva,
 * porque a placa física não tem. Placa incompleta ou inválida volta como está
 * — formatar um valor que ainda não é placa esconderia o erro de quem digitou.
 */
export function formatPlate(raw: string | null | undefined): string {
  const plate = normalizePlate(raw);
  if (plateKind(plate) === "antiga") return `${plate.slice(0, 3)}-${plate.slice(3)}`;
  return plate;
}

/**
 * O último dígito, que é o que o site público mostra.
 *
 * A placa inteira fica no painel, para a loja: publicá-la identifica o veículo
 * para qualquer um, e o mercado usa o final justamente para dar a informação
 * de rodízio sem entregar o resto.
 */
export function plateEnd(raw: string | null | undefined): string | null {
  const plate = normalizePlate(raw);
  if (!plate) return null;
  const ultimo = plate.slice(-1);
  return /[0-9]/.test(ultimo) ? ultimo : null;
}
