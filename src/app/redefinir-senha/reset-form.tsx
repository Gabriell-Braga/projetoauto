"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/field";
import {
  PasswordInput,
  PasswordMatchHint,
  PasswordRequirements,
} from "@/components/ui/password-input";
import { useToast } from "@/components/ui/toast";
import { apiPost, errorMessageFrom, fieldErrorsFrom, type FieldErrors } from "@/lib/client/api";
import { firstPasswordIssue } from "@/lib/auth/password-policy";

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const toast = useToast();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  function validate(): FieldErrors {
    const found: FieldErrors = {};
    const issue = firstPasswordIssue(password);
    if (issue) found.password = issue;
    if (!confirmPassword) found.confirmPassword = "Repita a nova senha.";
    else if (password !== confirmPassword) found.confirmPassword = "As senhas não conferem.";
    return found;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const localErrors = validate();
    if (Object.keys(localErrors).length > 0) {
      setErrors(localErrors);
      toast.error("Confira os campos destacados", Object.values(localErrors)[0]);
      return;
    }

    setSaving(true);
    setErrors({});

    const result = await apiPost("/api/auth/reset-password", {
      token,
      password,
      confirmPassword,
    });

    setSaving(false);
    if (!result.ok) {
      setErrors(fieldErrorsFrom(result.details));
      toast.error(
        result.error === "Dados inválidos" ? "Não foi possível salvar" : result.error,
        errorMessageFrom(result),
      );
      return;
    }

    setDone(true);
    toast.success("Senha alterada.", "Entre com a nova senha.");
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
      <div className="mb-4">
        <FormField label="Nova senha" htmlFor="password" error={errors.password} className="mb-0">
          <PasswordInput
            id="password"
            name="password"
            autoComplete="new-password"
            autoFocus
            value={password}
            aria-invalid={errors.password ? true : undefined}
            onChange={(event) => setPassword(event.target.value)}
          />
        </FormField>
        <PasswordRequirements value={password} />
      </div>

      <div className="mb-5">
        <FormField
          label="Confirme a nova senha"
          htmlFor="confirmPassword"
          error={errors.confirmPassword}
          className="mb-0"
        >
          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            autoComplete="new-password"
            value={confirmPassword}
            aria-invalid={errors.confirmPassword ? true : undefined}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
        </FormField>
        {errors.confirmPassword ? null : (
          <PasswordMatchHint password={password} confirmation={confirmPassword} />
        )}
      </div>

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
