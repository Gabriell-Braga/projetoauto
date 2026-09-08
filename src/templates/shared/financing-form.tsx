"use client";

import { useMemo, useState } from "react";
import { apiPost } from "@/lib/client/api";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { readUtm } from "./utm";

export type FinancingVehicleOption = {
  id: string;
  label: string;
  priceCents: number;
};

/**
 * Simulação de financiamento do site público.
 *
 * O que ela NÃO faz: dizer o valor da parcela. Parcela depende de taxa, e taxa
 * depende de análise do banco para aquela pessoa — publicar um número aqui
 * seria prometer uma condição que a loja não controla, e a conversa começaria
 * com o cliente cobrando um valor que ninguém ofereceu.
 *
 * O que ela faz: deixar a pessoa escolher carro, entrada e prazo, mostrar
 * quanto sobra para financiar, e mandar isso para a loja como proposta em
 * rascunho. A conta que aparece é subtração, não juros — dá para conferir de
 * cabeça, e por isso não engana.
 */
export function FinancingForm({
  tenantSlug,
  vehicles,
  defaults,
  preselectedVehicleId,
  initialDownCents,
  initialInstallments,
  /**
   * Modo curto, para a home.
   *
   * Mostra veiculo, entrada e prazo, e em vez de enviar leva para a pagina de
   * financiamento com o que a pessoa escolheu na URL. Pedir nome e telefone na
   * home cobraria o dado antes de a pessoa ter visto uma conta — e quem
   * abandona ali nao volta.
   */
  continueHref,
  tone = "light",
}: {
  tenantSlug: string;
  vehicles: FinancingVehicleOption[];
  defaults: { downPaymentPercent: number; terms: number[] };
  preselectedVehicleId?: string;
  initialDownCents?: number;
  initialInstallments?: number;
  continueHref?: string;
  tone?: "light" | "dark";
}) {
  const [vehicleId, setVehicleId] = useState(
    preselectedVehicleId ?? vehicles[0]?.id ?? "",
  );
  const [downText, setDownText] = useState(
    initialDownCents ? centsToText(initialDownCents) : "",
  );
  const [installments, setInstallments] = useState(
    // prazo vindo da home so vale se ainda for oferecido
    initialInstallments && defaults.terms.includes(initialInstallments)
      ? initialInstallments
      : (defaults.terms[0] ?? 48),
  );
  /*
   * Entrada vinda da home ja conta como digitada.
   *
   * Sem isso, o percentual padrao recalcularia por cima do valor que a pessoa
   * escolheu na tela anterior, e ela veria o proprio numero ser trocado.
   */
  const [touchedDown, setTouchedDown] = useState(Boolean(initialDownCents));
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const vehicle = vehicles.find((item) => item.id === vehicleId) ?? null;

  /*
   * A entrada acompanha o percentual padrão até a pessoa digitar a dela.
   *
   * Trocar de carro com entrada intocada recalcula; depois de digitada, o
   * valor é decisão dela e não pode ser reescrito por baixo do dedo.
   */
  const downCents = useMemo(() => {
    if (touchedDown) return parseReais(downText);
    if (!vehicle) return 0;
    return Math.round((vehicle.priceCents * defaults.downPaymentPercent) / 100);
  }, [touchedDown, downText, vehicle, defaults.downPaymentPercent]);

  const financedCents = Math.max(0, (vehicle?.priceCents ?? 0) - downCents);

  const fieldClass = cn(
    "w-full rounded-[var(--site-radius)] px-3 py-2.5 text-sm outline-none transition-colors",
    tone === "dark"
      ? "border border-white/15 bg-black/30 text-white placeholder:text-white/30"
      : "border border-[var(--site-border)] bg-[var(--site-surface)] text-[var(--site-text)]",
    "focus:border-[var(--site-primary)]",
  );

  const labelClass = cn(
    "mb-1 block text-xs font-medium",
    tone === "dark" ? "text-white/50" : "text-[var(--site-muted)]",
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const result = await apiPost("/api/leads", {
      tenantSlug,
      kind: "financiamento",
      vehicleId,
      name: String(form.get("name") ?? ""),
      phone: String(form.get("phone") ?? ""),
      email: String(form.get("email") ?? ""),
      message: String(form.get("message") ?? ""),
      website: String(form.get("website") ?? ""),
      financing: { downPaymentCents: downCents, installments },
      utm: readUtm(),
    });

    setSending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="rounded-[var(--site-radius)] border border-[var(--site-success)]/30 bg-[var(--site-success)]/10 px-4 py-5 text-sm">
        <p className="font-medium text-[var(--site-success)]">Simulação enviada!</p>
        <p className="mt-1 text-[var(--site-muted)]">
          A loja vai retornar com as condições disponíveis para o seu perfil.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4" noValidate>
      <div>
        <label className={labelClass} htmlFor="fin-vehicle">
          Veículo
        </label>
        <select
          id="fin-vehicle"
          className={fieldClass}
          value={vehicleId}
          onChange={(event) => setVehicleId(event.target.value)}
        >
          {vehicles.length === 0 ? <option value="">Nenhum veículo disponível</option> : null}
          {vehicles.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label} — {formatCurrency(item.priceCents)}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="fin-down">
            Entrada
          </label>
          <input
            id="fin-down"
            className={fieldClass}
            inputMode="decimal"
            placeholder={formatCurrency(downCents)}
            value={touchedDown ? downText : centsToText(downCents)}
            onChange={(event) => {
              setTouchedDown(true);
              setDownText(event.target.value);
            }}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="fin-term">
            Prazo
          </label>
          <select
            id="fin-term"
            className={fieldClass}
            value={installments}
            onChange={(event) => setInstallments(Number(event.target.value))}
          >
            {defaults.terms.map((term) => (
              <option key={term} value={term}>
                {term} meses
              </option>
            ))}
          </select>
        </div>
      </div>

      {/*
        A única conta mostrada é preço menos entrada. Nada de parcela: ela
        depende da taxa que o banco der para aquela pessoa.
      */}
      <div className="rounded-[var(--site-radius)] border border-[var(--site-border)] px-4 py-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-[var(--site-muted)]">Valor do veículo</span>
          <span className="tabular-nums text-[var(--site-text)]">
            {formatCurrency(vehicle?.priceCents ?? 0)}
          </span>
        </div>
        <div className="mt-1 flex items-center justify-between">
          <span className="text-[var(--site-muted)]">Entrada</span>
          <span className="tabular-nums text-[var(--site-text)]">
            {formatCurrency(downCents)}
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between border-t border-[var(--site-border)] pt-2 font-medium">
          <span className="text-[var(--site-text)]">A financiar</span>
          <span className="tabular-nums text-[var(--site-primary)]">
            {formatCurrency(financedCents)}
          </span>
        </div>
        <p className="mt-2 text-xs text-[var(--site-muted)]">
          A parcela depende da análise de crédito e é informada pela loja.
        </p>
      </div>

      {continueHref ? (
        <a
          href={continueUrl(continueHref, vehicleId, downCents, installments)}
          className="inline-flex items-center justify-center rounded-full bg-[var(--site-primary)] px-5 py-2.5 text-sm font-medium text-[var(--site-primary-foreground)] transition-colors hover:bg-[var(--site-primary-hover)]"
        >
          Continuar simulação
        </a>
      ) : null}

      {/*
        No modo curto o formulario para aqui.

        Nome e telefone sao pedidos na pagina de financiamento, depois de a
        pessoa ter visto a conta. Cobrar o dado antes disso e o que faz alguem
        fechar a aba na home.
      */}
      {!continueHref ? (
        <>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="fin-name">
              Nome completo
            </label>
            <input id="fin-name" name="name" required className={fieldClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="fin-phone">
              WhatsApp
            </label>
            <input
              id="fin-phone"
              name="phone"
              required
              inputMode="tel"
              className={fieldClass}
              placeholder="(31) 99999-8888"
            />
          </div>
        </div>

        <div>
          <label className={labelClass} htmlFor="fin-email">
            E-mail <span className="opacity-60">(opcional)</span>
          </label>
          <input id="fin-email" name="email" type="email" className={fieldClass} />
        </div>

        <div>
          <label className={labelClass} htmlFor="fin-message">
            Observação <span className="opacity-60">(opcional)</span>
          </label>
          <textarea id="fin-message" name="message" rows={2} className={fieldClass} />
        </div>

        {/* honeypot: some para gente, visível para robô */}
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="absolute h-0 w-0 overflow-hidden opacity-0"
        />

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={sending || vehicles.length === 0}
          className="rounded-full bg-[var(--site-primary)] px-5 py-2.5 text-sm font-medium text-[var(--site-primary-foreground)] transition-colors hover:bg-[var(--site-primary-hover)] disabled:opacity-60"
        >
          {sending ? "Enviando…" : "Enviar simulação"}
        </button>
        </>
      ) : null}
    </form>
  );
}

/**
 * Leva a escolha da home para a pagina de financiamento.
 *
 * Os tres valores viajam na URL, e nao em memoria: a pessoa pode abrir num
 * aba nova, voltar, ou mandar o link — e a simulacao continua de onde parou.
 */
function continueUrl(
  base: string,
  vehicleId: string,
  downCents: number,
  installments: number,
): string {
  const params = new URLSearchParams();
  if (vehicleId) params.set("veiculo", vehicleId);
  if (downCents > 0) params.set("entrada", String(downCents));
  params.set("prazo", String(installments));
  return `${base}?${params.toString()}`;
}

/** "30.000,00" -> 3000000 centavos. Aceita o que a pessoa digitar. */
function parseReais(text: string): number {
  const limpo = text.replace(/[^\d,]/g, "").replace(",", ".");
  const valor = Number(limpo);
  return Number.isFinite(valor) ? Math.round(valor * 100) : 0;
}

function centsToText(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
}
