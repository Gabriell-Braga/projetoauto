"use client";

import { useState } from "react";
import { apiPost } from "@/lib/client/api";
import { cn } from "@/lib/utils";
import { readUtm } from "./utm";

const CURRENT_YEAR = new Date().getFullYear();

/**
 * "Venda seu carro" do site público.
 *
 * O que a pessoa preenche aqui vira uma avaliação em rascunho no painel, com
 * o veículo já montado. Sem isso o vendedor receberia um recado em texto e
 * teria que redigitar marca, modelo, ano e quilometragem — que é exatamente o
 * trabalho que o formulário deveria ter poupado.
 *
 * Não pede placa nem documento. Nesta etapa a loja precisa saber QUAL é o
 * carro para dar um número; pedir dado sensível antes de existir conversa
 * derruba o preenchimento e cria obrigação de guarda que ninguém precisa
 * assumir ainda.
 *
 * Marca e modelo são texto livre, não lista: a consulta FIPE sai do navegador
 * e depende de cota por IP — colocá-la aqui faria o site do cliente gastar a
 * cota da revenda em visitante que nunca vai vender carro nenhum. Quem
 * normaliza é o vendedor, na ficha, com a FIPE do lado.
 */
export function SellCarForm({
  tenantSlug,
  tone = "light",
}: {
  tenantSlug: string;
  tone?: "light" | "dark";
}) {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fieldClass = cn(
    "w-full rounded-[var(--site-radius)] px-3 py-2.5 text-sm outline-none transition-colors",
    tone === "dark"
      ? "border border-white/15 bg-black/30 text-white placeholder:text-white/30"
      : "border border-[var(--site-border)] bg-[var(--site-surface)] text-[var(--site-text)] placeholder:text-[var(--site-muted)]",
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
    const anoFabricacao = Number(form.get("yearManufacture") ?? 0);
    const anoModelo = Number(form.get("yearModel") ?? 0);

    const result = await apiPost("/api/leads", {
      tenantSlug,
      kind: "venda",
      name: String(form.get("name") ?? ""),
      phone: String(form.get("phone") ?? ""),
      email: String(form.get("email") ?? ""),
      message: String(form.get("message") ?? ""),
      website: String(form.get("website") ?? ""),
      sellCar: {
        brand: String(form.get("brand") ?? ""),
        model: String(form.get("model") ?? ""),
        version: String(form.get("version") ?? ""),
        yearManufacture: anoFabricacao,
        // quem preenche só um dos anos quase sempre quis dizer os dois iguais
        yearModel: anoModelo || anoFabricacao,
        mileageKm: Number(String(form.get("mileageKm") ?? "").replace(/\D/g, "")) || 0,
      },
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
        <p className="font-medium text-[var(--site-success)]">Recebemos os dados do seu carro!</p>
        <p className="mt-1 text-[var(--site-muted)]">
          Nossa equipe vai avaliar e entrar em contato com uma proposta.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="sell-brand">
            Marca
          </label>
          <input
            id="sell-brand"
            name="brand"
            required
            className={fieldClass}
            placeholder="Chevrolet"
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="sell-model">
            Modelo
          </label>
          <input id="sell-model" name="model" required className={fieldClass} placeholder="Onix" />
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="sell-version">
          Versão <span className="opacity-60">(opcional)</span>
        </label>
        <input
          id="sell-version"
          name="version"
          className={fieldClass}
          placeholder="1.0 LT Turbo"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className={labelClass} htmlFor="sell-year-man">
            Ano de fabricação
          </label>
          <input
            id="sell-year-man"
            name="yearManufacture"
            type="number"
            required
            min={1950}
            max={CURRENT_YEAR + 1}
            className={fieldClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="sell-year-mod">
            Ano do modelo
          </label>
          <input
            id="sell-year-mod"
            name="yearModel"
            type="number"
            min={1950}
            max={CURRENT_YEAR + 1}
            className={fieldClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="sell-km">
            Quilometragem
          </label>
          <input
            id="sell-km"
            name="mileageKm"
            inputMode="numeric"
            className={fieldClass}
            placeholder="45000"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="sell-name">
            Seu nome
          </label>
          <input id="sell-name" name="name" required className={fieldClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="sell-phone">
            WhatsApp
          </label>
          <input
            id="sell-phone"
            name="phone"
            required
            inputMode="tel"
            className={fieldClass}
            placeholder="(31) 99999-8888"
          />
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="sell-email">
          E-mail <span className="opacity-60">(opcional)</span>
        </label>
        <input id="sell-email" name="email" type="email" className={fieldClass} />
      </div>

      <div>
        <label className={labelClass} htmlFor="sell-message">
          Algo que a gente deva saber? <span className="opacity-60">(opcional)</span>
        </label>
        <textarea
          id="sell-message"
          name="message"
          rows={3}
          className={fieldClass}
          placeholder="Pneus novos, revisão em dia, único dono…"
        />
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
        disabled={sending}
        className="rounded-full bg-[var(--site-primary)] px-5 py-2.5 text-sm font-medium text-[var(--site-primary-foreground)] transition-colors hover:bg-[var(--site-primary-hover)] disabled:opacity-60"
      >
        {sending ? "Enviando…" : "Quero uma avaliação"}
      </button>

      <p className="text-xs text-[var(--site-muted)]">
        A avaliação é uma estimativa inicial. O valor final depende da vistoria do veículo.
      </p>
    </form>
  );
}
