"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiDelete } from "@/lib/client/api";

export function DeleteVehicleButton({
  vehicleId,
  label,
}: {
  vehicleId: string;
  label: string;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (!window.confirm(`Excluir o anúncio "${label}"? As fotos também serão apagadas.`)) return;

    setDeleting(true);
    setError(null);

    const result = await apiDelete(`/api/admin/vehicles/${vehicleId}`);
    if (!result.ok) {
      setError(result.error);
      setDeleting(false);
      return;
    }

    router.push("/admin/estoque");
    router.refresh();
  }

  return (
    <Card className="border-red-200">
      <CardHeader className="border-red-100">
        <CardTitle className="text-red-700">Excluir anúncio</CardTitle>
        <CardDescription>
          Remove o veículo e todas as fotos definitivamente. Para tirar do site sem perder o
          histórico, use a situação &quot;Vendido&quot;.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button type="button" variant="danger" disabled={deleting} onClick={handleDelete}>
          {deleting ? "Excluindo..." : "Excluir veículo"}
        </Button>
        {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
      </CardContent>
    </Card>
  );
}
