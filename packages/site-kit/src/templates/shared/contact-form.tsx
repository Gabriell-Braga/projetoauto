"use client";

import { useState } from "react";
import { apiPost } from "../../lib/client-api";
import { readUtm } from "./utm";
import { maskPhone } from "../../lib/masks";

const field =
  "w-full rounded-[var(--site-radius)] border border-[var(--site-border)] bg-[var(--site-surface)] px-3.5 py-2.5 text-sm text-[var(--site-text)] outline-none transition-colors placeholder:text-[var(--site-muted)] focus:border-[var(--site-primary)]";

const label = "mb-1.5 block text-xs font-medium text-[var(--site-muted)]";

/**
 * Assuntos do desenho.
 *
 * Lista fechada em vez de texto livre: o assunto é o que decide quem atende, e
 * "gostaria de informações" não roteia para ninguém. Ele viaja no corpo da
 * mensagem, onde o vendedor lê.
 */
const ASSUNTOS = [
  "Quero comprar um carro",
  "Quero financiar",
  "Quero vender meu carro",
  "Dúvida sobre um veículo",
  "Outro assunto",
];

/** "Envie uma mensagem" — o formulário da página de contato, como no desenho. */
export function ContactForm({ tenantSlug }: { tenantSlug: string }) {
  const [sent, setSent] = useState(false);
  const [phone, setPhone] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const assunto = String(form.get("subject") ?? "").trim();
    const mensagem = String(form.get("message") ?? "").trim();

    const result = await apiPost("/api/leads", {
      tenantSlug,
      kind: "contato",
      name: String(form.get("name") ?? ""),
      phone: String(form.get("phone") ?? ""),
      email: String(form.get("email") ?? ""),
      message: [assunto ? `Assunto: ${assunto}` : "", mensagem].filter(Boolean).join("\n"),
      website: String(form.get("website") ?? ""),
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
        <p className="font-medium text-[var(--site-success)]">Mensagem enviada!</p>
        <p className="mt-1 text-[var(--site-muted)]">
          A loja retorna pelo canal que você informou.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2" noValidate>
      <div>
        <label className={label} htmlFor="ct-name">
          Nome
        </label>
        <input id="ct-name" name="name" required placeholder="Seu nome" className={field} />
      </div>
      <div>
        <label className={label} htmlFor="ct-phone">
          WhatsApp
        </label>
        <input
          id="ct-phone"
          name="phone"
          required
          inputMode="tel"
          placeholder="(31) 99999-9999"
          className={field}
          value={phone}
          onChange={(event) => setPhone(maskPhone(event.target.value))}
        />
      </div>

      <div className="sm:col-span-2">
        <label className={label} htmlFor="ct-email">
          E-mail
        </label>
        <input
          id="ct-email"
          name="email"
          type="email"
          placeholder="voce@email.com"
          className={field}
        />
      </div>

      <div className="sm:col-span-2">
        <label className={label} htmlFor="ct-subject">
          Assunto
        </label>
        <select id="ct-subject" name="subject" defaultValue="" className={field}>
          <option value="">Selecione o assunto</option>
          {ASSUNTOS.map((assunto) => (
            <option key={assunto} value={assunto}>
              {assunto}
            </option>
          ))}
        </select>
      </div>

      <div className="sm:col-span-2">
        <label className={label} htmlFor="ct-message">
          Mensagem
        </label>
        <textarea
          id="ct-message"
          name="message"
          rows={4}
          placeholder="Conte brevemente como podemos ajudar."
          className={field}
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

      {error ? <p className="text-sm text-red-600 sm:col-span-2">{error}</p> : null}

      <button
        type="submit"
        disabled={sending}
        className="rounded-[var(--site-radius)] bg-[var(--site-primary)] px-5 py-3 text-sm font-medium text-[var(--site-primary-foreground)] transition-colors hover:bg-[var(--site-primary-hover)] disabled:opacity-60 sm:col-span-2"
      >
        {sending ? "Enviando…" : "Enviar mensagem"}
      </button>

      <p className="text-xs text-[var(--site-muted)] sm:col-span-2">
        Ao enviar, você autoriza o contato da loja sobre esta solicitação.
      </p>
    </form>
  );
}
