"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FormField, Input } from "@/components/ui/field";
import { apiPost } from "@/lib/client/api";

export function ChangePasswordForm({ redirectTo }: { redirectTo: string }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const result = await apiPost("/api/auth/change-password", {
      currentPassword: String(form.get("currentPassword") ?? ""),
      newPassword: String(form.get("newPassword") ?? ""),
      confirmPassword: String(form.get("confirmPassword") ?? ""),
    });

    if (!result.ok) {
      const detail = Array.isArray(result.details)
        ? (result.details as { message: string }[])[0]?.message
        : null;
      setError(detail ?? result.error);
      setSaving(false);
      return;
    }

    router.replace(redirectTo);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit}>
      <FormField label="Senha atual" htmlFor="currentPassword">
        <Input id="currentPassword" name="currentPassword" type="password" required />
      </FormField>
      <FormField label="Nova senha" htmlFor="newPassword" hint="Mínimo de 8 caracteres">
        <Input id="newPassword" name="newPassword" type="password" minLength={8} required />
      </FormField>
      <FormField label="Confirme a nova senha" htmlFor="confirmPassword">
        <Input id="confirmPassword" name="confirmPassword" type="password" minLength={8} required />
      </FormField>

      {error ? (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <Button type="submit" className="w-full" size="lg" disabled={saving}>
        {saving ? "Salvando..." : "Salvar nova senha"}
      </Button>
    </form>
  );
}
