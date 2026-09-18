"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { apiPost } from "@/lib/client/api";

type SyncReport = {
  portal: string;
  published: number;
  updated: number;
  removed: number;
  failed: number;
  error?: string;
};

/**
 * "Sincronizar agora": passa o estoque inteiro pelo portal e conta o que
 * aconteceu. Vive no card e na tela de anúncios, com o mesmo comportamento.
 */
export function SyncButton({
  portalKey,
  portalName,
  size = "sm",
}: {
  portalKey: string;
  portalName: string;
  size?: "sm" | "md";
}) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  async function handleSync() {
    setBusy(true);
    const result = await apiPost<{ reports: SyncReport[] }>("/api/admin/portals/sync", {});
    setBusy(false);

    if (!result.ok) {
      toast.error("Não consegui sincronizar", result.error);
      return;
    }
    const report = result.data.reports.find((item) => item.portal === portalKey);
    if (!report) {
      toast.info("Nada para sincronizar", "Não há carros para enviar a este portal.");
    } else if (report.error) {
      toast.error(`${portalName} parou`, report.error);
    } else {
      const parts = [
        report.published ? `${report.published} publicado(s)` : null,
        report.updated ? `${report.updated} atualizado(s)` : null,
        report.removed ? `${report.removed} removido(s)` : null,
        report.failed ? `${report.failed} com erro` : null,
      ].filter(Boolean);
      const text = parts.length > 0 ? parts.join(", ") : "Tudo já estava em dia.";
      if (report.failed > 0)
        toast.error(`${portalName}: ${text}`, "Os motivos estão na lista de anúncios.");
      else toast.success(`${portalName} sincronizado`, text);
    }
    router.refresh();
  }

  return (
    <Button type="button" size={size} loading={busy} onClick={handleSync}>
      <RefreshCw className="h-3.5 w-3.5" />
      Sincronizar agora
    </Button>
  );
}
