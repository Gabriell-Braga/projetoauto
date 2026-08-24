"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FormField, Input } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { apiPost } from "@/lib/client/api";

export function ChangePasswordForm({ redirectTo }: { redirectTo: string }) {
  const router = useRouter();
  const toast = useToast();
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);

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
      toast.error(detail ?? result.error);
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


      <Button type="submit" className="w-full" size="lg" loading={saving}>
        Salvar nova senha
      </Button>
    </form>
  );
}
