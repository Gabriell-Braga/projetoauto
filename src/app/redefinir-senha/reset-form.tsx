"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FormField, Input } from "@/components/ui/field";
import { apiPost } from "@/lib/client/api";

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const result = await apiPost("/api/auth/reset-password", {
      token,
      password: String(form.get("password") ?? ""),
      confirmPassword: String(form.get("confirmPassword") ?? ""),
    });

    setSaving(false);
    if (!result.ok) {
      const detail = Array.isArray(result.details)
        ? (result.details as { message: string }[])[0]?.message
        : null;
      setError(detail ?? result.error);
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div>
        <p className="rounded border border-border border-l-2 border-l-positive bg-positive-soft px-3 py-2.5 text-[13px] text-text">
          Senha alterada.
        </p>
        <p className="mt-3 text-[13px] leading-relaxed text-muted">
          Todas as sessões abertas foram encerradas. Entre com a nova senha.
        </p>
        <Button className="mt-5 w-full" size="lg" onClick={() => router.replace("/login")}>
          Ir para o login
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <FormField label="Nova senha" htmlFor="password" hint="Mínimo de 8 caracteres">
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          autoFocus
        />
      </FormField>

      <FormField label="Confirme a nova senha" htmlFor="confirmPassword">
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
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

      <Button type="submit" size="lg" className="w-full" loading={saving}>
        Salvar nova senha
      </Button>

      <Link
        href="/esqueci-senha"
        className="mt-4 block text-center text-[13px] text-muted hover:text-text"
      >
        Pedir um novo link
      </Link>
    </form>
  );
}
