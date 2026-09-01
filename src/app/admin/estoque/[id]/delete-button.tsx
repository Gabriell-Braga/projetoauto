"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useConfirm } from "@/components/ui/confirm";
import { useToast } from "@/components/ui/toast";
import { apiDelete } from "@/lib/client/api";

export function DeleteVehicleButton({ vehicleId, label }: { vehicleId: string; label: string }) {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    const confirmed = await confirm({
      title: "Excluir anúncio",
      description: `"${label}" e todas as fotos dele saem do ar definitivamente. Para tirar do site sem perder o histórico, mude a situação para "Vendido".`,
      confirmLabel: "Excluir anúncio",
      tone: "danger",
    });
    if (!confirmed) return;

    setDeleting(true);
    const result = await apiDelete(`/api/admin/vehicles/${vehicleId}`);

    if (!result.ok) {
      toast.error(result.error);
      setDeleting(false);
      return;
    }

    router.push("/admin/estoque");
    router.refresh();
  }

  return (
    <Card className="border-danger/40">
      <CardHeader className="border-danger/25">
        <CardTitle className="text-danger">Excluir anúncio</CardTitle>
        <CardDescription>
          Remove o veículo e todas as fotos definitivamente. Para tirar do site sem perder o
          histórico, mude a situação para &quot;Vendido&quot;.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button type="button" variant="danger" loading={deleting} onClick={handleDelete}>
          Excluir veículo
        </Button>
      </CardContent>
    </Card>
  );
}
