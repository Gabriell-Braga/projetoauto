"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { apiPost } from "@/lib/client/api";

/** Abre o painel da revenda como se fosse o admin dela — registrado na auditoria. */
export function ImpersonateButton({
  tenantId,
  tenantName,
  disabled,
}: {
  tenantId: string;
  tenantName: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    const confirmed = window.confirm(
      `Entrar no painel de "${tenantName}"? Todas as ações ficam registradas na auditoria como suas.`,
    );
    if (!confirmed) return;

    setBusy(true);
    const result = await apiPost<{ redirectTo: string }>("/api/auth/impersonate", { tenantId });

    if (!result.ok) {
      toast.error(result.error);
      setBusy(false);
      return;
    }

    router.replace(result.data.redirectTo);
    router.refresh();
  }

  return (
    <Button type="button" disabled={disabled} loading={busy} onClick={handleClick}>
      <LogIn className="h-3.5 w-3.5" />
      Entrar como revenda
    </Button>
  );
}
