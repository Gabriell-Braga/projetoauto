"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiPost } from "@/lib/client/api";

/** Abre o painel da revenda como se fosse o admin dela (fica no audit_log). */
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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (
      !window.confirm(
        `Entrar no painel de "${tenantName}"? Todas as ações ficarão registradas na auditoria como suas.`,
      )
    ) {
      return;
    }

    setBusy(true);
    setError(null);

    const result = await apiPost<{ redirectTo: string }>("/api/auth/impersonate", { tenantId });
    if (!result.ok) {
      setError(result.error);
      setBusy(false);
      return;
    }

    router.replace(result.data.redirectTo);
    router.refresh();
  }

  return (
    <>
      <Button type="button" disabled={disabled || busy} onClick={handleClick}>
        <LogIn className="h-4 w-4" />
        {busy ? "Entrando..." : "Entrar como revenda"}
      </Button>
      {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
    </>
  );
}
