"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/field";
import { apiDelete } from "@/lib/client/api";

export function DangerZone({ tenantId, tenantName }: { tenantId: string; tenantName: string }) {
  const router = useRouter();
  const [confirmation, setConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canDelete = confirmation.trim().toLowerCase() === tenantName.trim().toLowerCase();

  async function handleDelete() {
    setDeleting(true);
    setError(null);

    const result = await apiDelete(`/api/super-admin/tenants/${tenantId}`);
    if (!result.ok) {
      setError(result.error);
      setDeleting(false);
      return;
    }

    router.push("/super-admin/revendas");
    router.refresh();
  }

  return (
    <Card className="border-red-200">
      <CardHeader className="border-red-100">
        <CardTitle className="text-red-700">Excluir revenda</CardTitle>
        <CardDescription>
          O site sai do ar, todos os acessos são desativados e o slug é liberado. Os dados ficam
          arquivados no banco para consulta e auditoria.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="mb-2 text-sm text-ink-600">
          Digite <strong>{tenantName}</strong> para confirmar:
        </p>
        <div className="flex flex-wrap gap-3">
          <Input
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            placeholder={tenantName}
            className="max-w-xs"
          />
          <Button
            type="button"
            variant="danger"
            disabled={!canDelete || deleting}
            onClick={handleDelete}
          >
            {deleting ? "Excluindo..." : "Excluir revenda"}
          </Button>
        </div>
        {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
      </CardContent>
    </Card>
  );
}
