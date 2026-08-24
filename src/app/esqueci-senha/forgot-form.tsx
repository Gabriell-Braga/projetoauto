"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FormField, Input } from "@/components/ui/field";
import { apiPost } from "@/lib/client/api";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<{ emailConfigured: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSending(true);
    setError(null);

    const result = await apiPost<{ emailConfigured: boolean }>("/api/auth/forgot-password", {
      email,
    });

    setSending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSent({ emailConfigured: result.data.emailConfigured });
  }

  if (sent) {
    return (
      <div>
        <p className="rounded border border-border border-l-2 border-l-positive bg-positive-soft px-3 py-2.5 text-[13px] text-text">
          Pedido registrado.
        </p>
        <p className="mt-3 text-[13px] leading-relaxed text-muted">
          {sent.emailConfigured
            ? "Se existir uma conta com esse e-mail, o link de redefinição chega em instantes. Ele vale por 1 hora."
            : "O envio automático por e-mail ainda não está ativo nesta instalação. Avise o suporte: o link de redefinição fica disponível no Painel Geral."}
        </p>
        <Link
          href="/login"
          className="mt-5 inline-block text-[13px] text-accent-text hover:underline"
        >
          Voltar para o login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <FormField label="E-mail da conta" htmlFor="email">
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          autoFocus
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="voce@revenda.com.br"
        />
      </FormField>

      {error ? (
        <p
          role="alert"
          className="mb-4 rounded border border-border border-l-2 border-l-danger bg-danger-soft px-3 py-2 text-[13px] text-text"
        >
          {error}
        </p>
      ) : null}

      <Button type="submit" size="lg" className="w-full" loading={sending}>
        Enviar link de redefinição
      </Button>

      <Link
        href="/login"
        className="mt-4 block text-center text-[13px] text-muted hover:text-text"
      >
        Voltar para o login
      </Link>
    </form>
  );
}
