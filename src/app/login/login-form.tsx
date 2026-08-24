"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FormField, Input } from "@/components/ui/field";
import { apiPost } from "@/lib/client/api";

export function LoginForm({ next }: { next?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const result = await apiPost<{ redirectTo: string }>("/api/auth/login", {
      email,
      password,
      next,
    });

    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }

    router.replace(result.data.redirectTo);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <FormField label="E-mail" htmlFor="email">
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          autoFocus
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="voce@revenda.com.br"
          aria-invalid={error ? true : undefined}
        />
      </FormField>

      <FormField label="Senha" htmlFor="password">
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="••••••••"
          aria-invalid={error ? true : undefined}
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

      <Button type="submit" size="lg" className="w-full" loading={loading}>
        Entrar
      </Button>
    </form>
  );
}
