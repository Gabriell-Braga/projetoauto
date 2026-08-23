"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { apiPost } from "@/lib/client/api";

/** Fica sempre visível para o super-admin não esquecer que está dentro de uma revenda. */
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
    <div className="flex flex-wrap items-center justify-between gap-3 bg-amber-500 px-4 py-2.5 text-sm text-amber-950 md:px-8">
      <span className="flex items-center gap-2 font-medium">
        <ShieldAlert className="h-4 w-4" />
        Você está acessando como <strong>{tenantName}</strong>. Tudo o que fizer fica registrado na
        auditoria.
      </span>
      <button
        type="button"
        onClick={handleStop}
        disabled={leaving}
        className="rounded-lg bg-amber-950 px-3 py-1.5 text-xs font-semibold text-amber-50 transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {leaving ? "Saindo..." : "Sair da revenda"}
      </button>
    </div>
  );
}
