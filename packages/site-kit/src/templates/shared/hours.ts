export type BusinessHour = { weekday: number; open: string | null; close: string | null };

const NOMES = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const CURTOS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export type HourLine = { label: string; value: string };

/**
 * Agrupa os dias em faixas legíveis: "Seg a Sex — 8h às 18h".
 *
 * O site mostra isso em três lugares (barra do topo, rodapé, página de
 * contato), e listar sete linhas em todos eles ocupa espaço sem informar mais.
 * O agrupamento junta dias CONSECUTIVOS com o mesmo horário.
 *
 * Dia fechado interrompe a faixa em vez de ser omitido. Omitir produziria
 * "Seg a Dom" numa loja que não abre domingo — e alguém apareceria na porta
 * fechada por causa do texto.
 */
export function summarizeHours(hours: BusinessHour[]): HourLine[] {
  if (hours.length === 0) return [];

  // a semana começa na segunda: é como a loja pensa, e deixa o fim de semana
  // junto no fim em vez de partido entre as pontas
  const ordem = [1, 2, 3, 4, 5, 6, 0];
  const porDia = new Map(hours.map((hour) => [hour.weekday, hour]));

  const linhas: HourLine[] = [];
  let inicio: number | null = null;
  let anterior: number | null = null;
  let atual: string | null = null;

  const fechar = () => {
    if (inicio === null || anterior === null || atual === null) return;
    linhas.push({
      label:
        inicio === anterior
          ? NOMES[inicio]
          : `${CURTOS[inicio]} a ${CURTOS[anterior]}`,
      value: atual,
    });
  };

  for (const dia of ordem) {
    const hour = porDia.get(dia);
    const valor = describeDay(hour);

    if (valor === atual && anterior !== null) {
      anterior = dia;
      continue;
    }

    fechar();
    inicio = dia;
    anterior = dia;
    atual = valor;
  }
  fechar();

  return linhas;
}

/** "8h às 18h" quando abre; "Fechado" quando não. */
function describeDay(hour: BusinessHour | undefined): string {
  if (!hour || !hour.open || !hour.close) return "Fechado";
  return `${formatTime(hour.open)} às ${formatTime(hour.close)}`;
}

/**
 * "08:00" vira "8h"; "08:30" vira "8h30".
 *
 * Zero à esquerda e minuto redondo são ruído numa linha que a pessoa lê de
 * passagem — ninguém escreve "das 08:00 às 18:00" num cartaz de loja.
 */
export function formatTime(value: string): string {
  const [hora, minuto] = value.split(":");
  const h = Number(hora);
  if (!Number.isFinite(h)) return value;
  return minuto && minuto !== "00" ? `${h}h${minuto}` : `${h}h`;
}

/**
 * Uma linha só, para a barra do topo: a primeira faixa que abre.
 *
 * Devolve nulo quando a loja não informou horário nenhum — a barra some, em
 * vez de anunciar um horário inventado.
 */
export function headlineHours(hours: BusinessHour[]): string | null {
  const linhas = summarizeHours(hours).filter((linha) => linha.value !== "Fechado");
  if (linhas.length === 0) return null;
  return `${linhas[0].label}, ${linhas[0].value}`;
}
