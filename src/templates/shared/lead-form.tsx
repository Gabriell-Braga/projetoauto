"use client";

import { useState } from "react";
import { apiPost } from "@/lib/client/api";
import { cn } from "@/lib/utils";

/**
 * Formulário de lead compartilhado pelos templates.
 * A aparência acompanha o tom (claro/escuro); a lógica é a mesma.
 */
export function LeadForm({
  tenantSlug,
  vehicleId,
  vehicleLabel,
  tone = "light",
}: {
  tenantSlug: string;
  vehicleId?: string;
  vehicleLabel?: string;
  tone?: "light" | "dark";
}) {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fieldClass = cn(
    "w-full px-3 py-2.5 text-sm outline-none transition-colors",
    tone === "dark"
      ? "border border-white/15 bg-neutral-950 text-white placeholder:text-white/30 focus:border-[var(--site-primary)]"
      : "rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-[var(--site-primary)]",
  );

  const labelClass = cn(
    "mb-1 block text-xs font-medium",
    tone === "dark" ? "uppercase tracking-widest text-white/40" : "text-slate-500",
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const result = await apiPost("/api/leads", {
      tenantSlug,
      vehicleId: vehicleId ?? "",
      name: String(form.get("name") ?? ""),
      phone: String(form.get("phone") ?? ""),
      email: String(form.get("email") ?? ""),
      message: String(form.get("message") ?? ""),
      website: String(form.get("website") ?? ""),
      utm: {
        referrer: typeof document !== "undefined" ? document.referrer : undefined,
        page: typeof window !== "undefined" ? window.location.pathname : undefined,
        ...readUtmFromUrl(),
      },
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
      <div
        className={cn(
          "px-4 py-5 text-sm",
          tone === "dark"
            ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
            : "rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800",
        )}
      >
        <p className="font-medium">Mensagem enviada!</p>
        <p className="mt-1 opacity-80">Em breve entraremos em contato.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <p
        className={cn(
          "mb-3 text-sm font-semibold",
          tone === "dark" ? "uppercase tracking-widest text-white/70" : "text-slate-900",
        )}
      >
        {vehicleLabel ? "Tenho interesse neste veículo" : "Fale com a gente"}
      </p>

      <div className="mb-3">
        <label className={labelClass} htmlFor="lead-name">
          Nome
        </label>
        <input id="lead-name" name="name" required minLength={2} className={fieldClass} />
      </div>

      <div className="mb-3">
        <label className={labelClass} htmlFor="lead-phone">
          Telefone / WhatsApp
        </label>
        <input
          id="lead-phone"
          name="phone"
          required
          inputMode="tel"
          placeholder="(11) 99999-8888"
          className={fieldClass}
        />
      </div>

      <div className="mb-3">
        <label className={labelClass} htmlFor="lead-email">
          E-mail (opcional)
        </label>
        <input id="lead-email" name="email" type="email" className={fieldClass} />
      </div>

      <div className="mb-4">
        <label className={labelClass} htmlFor="lead-message">
          Mensagem
        </label>
        <textarea
          id="lead-message"
          name="message"
          rows={3}
          defaultValue={vehicleLabel ? `Olá! Tenho interesse no ${vehicleLabel}.` : ""}
          className={cn(fieldClass, "resize-y")}
        />
      </div>

      {/* honeypot anti-spam: invisível para pessoas */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
      />

      {error ? (
        <p
          className={cn(
            "mb-3 px-3 py-2 text-sm",
            tone === "dark"
              ? "border border-red-500/30 bg-red-500/10 text-red-200"
              : "rounded-lg border border-red-200 bg-red-50 text-red-700",
          )}
        >
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={sending}
        className={cn(
          "w-full py-3 text-sm font-medium disabled:opacity-60",
          tone === "dark" ? "text-xs font-bold uppercase tracking-widest" : "rounded-lg",
        )}
        style={{
          backgroundColor: "var(--site-primary)",
          color: "var(--site-primary-foreground)",
        }}
      >
        {sending ? "Enviando..." : "Enviar mensagem"}
      </button>

      <p
        className={cn(
          "mt-2 text-center text-[11px]",
          tone === "dark" ? "text-white/30" : "text-slate-400",
        )}
      >
        Seus dados são usados apenas para este atendimento.
      </p>
    </form>
  );
}

function readUtmFromUrl(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  const utm: Record<string, string> = {};
  for (const key of ["source", "medium", "campaign", "term", "content"]) {
    const value = params.get(`utm_${key}`);
    if (value) utm[key] = value.slice(0, 120);
  }
  return utm;
}
