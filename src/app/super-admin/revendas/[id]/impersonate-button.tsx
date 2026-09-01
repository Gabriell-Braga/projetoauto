"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm";
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
  const confirm = useConfirm();
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    const confirmed = await confirm({
      title: `Entrar como ${tenantName}`,
      description: "Você passa a ver o painel como o administrador da revenda. Tudo o que fizer fica registrado na auditoria com o seu nome.",
      confirmLabel: "Entrar no painel",
    });
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
