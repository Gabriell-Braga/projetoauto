"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { apiPost } from "@/lib/client/api";

/** Faixa âmbar constante: o super-admin precisa saber que não está na própria sessão. */
export function ImpersonationBanner({ tenantName }: { tenantName: string }) {
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);

  async function handleStop() {
    setLeaving(true);
    const result = await apiPost<{ redirectTo: string }>("/api/auth/stop-impersonate");
    if (!result.ok) {
      setLeaving(false);
      return;
    }
    router.replace(result.data.redirectTo);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-accent px-3 py-1.5 sm:px-4">
      <span className="flex items-center gap-2 text-xs text-accent-contrast">
        <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
        Acessando como <strong className="font-semibold">{tenantName}</strong> — cada ação fica
        registrada na auditoria em seu nome.
      </span>
      <button
        type="button"
        onClick={handleStop}
        disabled={leaving}
        className="flex items-center gap-2 rounded-full border border-accent-contrast/30 px-4 py-2 text-sm font-medium text-accent-contrast transition-opacity hover:opacity-80 disabled:opacity-60"
      >
        {leaving ? <Spinner size={12} /> : null}
        Sair da revenda
      </button>
    </div>
  );
}
