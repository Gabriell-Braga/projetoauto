/**
 * Composição técnica do login: um tacômetro abstrato desenhado em código.
 * Linhas finas em --border, um único arco em --accent. Sem imagem, sem stock.
 */

const CX = 300;
const CY = 300;

/** Grau -> ponto, com 0° apontando para leste e crescendo no sentido horário. */
function point(radius: number, degrees: number) {
  const radians = (degrees * Math.PI) / 180;
  return {
    x: CX + radius * Math.cos(radians),
    y: CY + radius * Math.sin(radians),
  };
}

function arcPath(radius: number, fromDegrees: number, toDegrees: number) {
  const start = point(radius, fromDegrees);
  const end = point(radius, toDegrees);
  const largeArc = Math.abs(toDegrees - fromDegrees) > 180 ? 1 : 0;
  return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
}

const SWEEP_START = 135;
const SWEEP_END = 405;
const TICK_COUNT = 45;
/** Onde o arco âmbar para — o "ponteiro" da composição. */
const NEEDLE_AT = SWEEP_START + (SWEEP_END - SWEEP_START) * 0.72;

export function InstrumentPanel({ className }: { className?: string }) {
  const ticks = Array.from({ length: TICK_COUNT }, (_, index) => {
    const degrees = SWEEP_START + ((SWEEP_END - SWEEP_START) * index) / (TICK_COUNT - 1);
    const major = index % 5 === 0;
    const inner = point(major ? 186 : 198, degrees);
    const outer = point(212, degrees);
    return { degrees, major, inner, outer };
  });

  const needle = point(150, NEEDLE_AT);

  return (
    <svg
      viewBox="0 0 600 600"
      role="presentation"
      aria-hidden="true"
      className={className}
      fill="none"
    >
      {/* grade de fundo */}
      <g stroke="var(--border)" strokeWidth="1" opacity="0.5">
        {[120, 220, 320, 420, 500].map((y) => (
          <line key={`h-${y}`} x1="40" y1={y} x2="560" y2={y} />
        ))}
        {[100, 300, 500].map((x) => (
          <line key={`v-${x}`} x1={x} y1="60" x2={x} y2="540" />
        ))}
      </g>

      {/* anéis */}
      <circle cx={CX} cy={CY} r="242" stroke="var(--border)" strokeWidth="1" />
      <circle cx={CX} cy={CY} r="150" stroke="var(--border)" strokeWidth="1" />
      <circle cx={CX} cy={CY} r="66" stroke="var(--border)" strokeWidth="1" />

      {/* trilho do mostrador */}
      <path
        d={arcPath(212, SWEEP_START, SWEEP_END)}
        stroke="var(--border-strong)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* marcações */}
      <g strokeLinecap="round">
        {ticks.map((tick) => (
          <line
            key={tick.degrees}
            x1={tick.inner.x.toFixed(2)}
            y1={tick.inner.y.toFixed(2)}
            x2={tick.outer.x.toFixed(2)}
            y2={tick.outer.y.toFixed(2)}
            stroke={tick.degrees <= NEEDLE_AT ? "var(--border-strong)" : "var(--border)"}
            strokeWidth={tick.major ? 2 : 1}
          />
        ))}
      </g>

      {/* o único traço âmbar da composição */}
      <path
        d={arcPath(228, SWEEP_START, NEEDLE_AT)}
        stroke="var(--accent)"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* ponteiro */}
      <line
        x1={CX}
        y1={CY}
        x2={needle.x.toFixed(2)}
        y2={needle.y.toFixed(2)}
        stroke="var(--accent)"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.9"
      />
      <circle cx={CX} cy={CY} r="5" fill="var(--accent)" />
      <circle cx={CX} cy={CY} r="14" stroke="var(--accent-line)" strokeWidth="1" />
    </svg>
  );
}
