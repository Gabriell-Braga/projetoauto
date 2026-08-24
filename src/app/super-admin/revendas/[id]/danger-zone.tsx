"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { apiDelete } from "@/lib/client/api";

export function DangerZone({ tenantId, tenantName }: { tenantId: string; tenantName: string }) {
  const router = useRouter();
  const toast = useToast();
  const [confirmation, setConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);

  const canDelete = confirmation.trim().toLowerCase() === tenantName.trim().toLowerCase();

  async function handleDelete() {
    setDeleting(true);
    const result = await apiDelete(`/api/super-admin/tenants/${tenantId}`);

    if (!result.ok) {
      toast.error(result.error);
      setDeleting(false);
      return;
    }

    router.push("/super-admin/revendas");
    router.refresh();
  }

  return (
    <Card className="border-danger/40">
      <CardHeader className="border-danger/25">
        <CardTitle className="text-danger">Excluir revenda</CardTitle>
        <CardDescription>
          O site sai do ar, todos os acessos são desativados e o slug é liberado. Os dados ficam
          arquivados no banco para consulta e auditoria.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="mb-2 text-[13px] text-muted">
          Digite <strong className="font-medium text-text">{tenantName}</strong> para confirmar:
        </p>
        <div className="flex flex-wrap gap-2">
          <Input
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            placeholder={tenantName}
            className="max-w-xs"
            aria-label="Confirmação do nome da revenda"
          />
          <Button type="button" variant="danger" disabled={!canDelete} loading={deleting} onClick={handleDelete}>
            Excluir revenda
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
