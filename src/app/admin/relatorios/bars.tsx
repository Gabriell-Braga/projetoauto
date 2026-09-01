import { formatNumber } from "@/lib/utils";

/**
 * Barras proporcionais ao maior valor da série.
 *
 * Sem biblioteca de gráfico: o bundle roda em Worker e uma barra é uma div com
 * largura percentual. O número fica sempre visível ao lado, porque barra curta
 * demais não se lê — o dado é a informação, o desenho é só a comparação.
 */
export function Bars({
  items,
}: {
  items: { label: string; value: number; detail?: string }[];
}) {
  // divisor mínimo 1: série inteira zerada não pode dividir por zero
  const max = Math.max(...items.map((item) => item.value), 1);

  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((item) => (
        <li key={item.label}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-[13px]">
            <span className="truncate text-text">{item.label}</span>
            <span className="shrink-0 tabular-nums text-muted">
              {formatNumber(item.value)}
              {item.detail ? <span className="ml-1.5 text-faint">{item.detail}</span> : null}
            </span>
          </div>
          <div className="h-1.5 w-full rounded-sm bg-surface-2">
            <div
              className="h-full rounded-sm bg-accent"
              style={{ width: `${Math.round((item.value / max) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
