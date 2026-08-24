import Link from "next/link";
import { PageHeader } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/table";
import { Card } from "@/components/ui/card";

export default function AdminNotFound() {
  return (
    <>
      <PageHeader title="Não encontrado" description="Este registro não existe ou foi removido." />
      <Card>
        <EmptyState
          title="Nada por aqui"
          description="O item pode ter sido excluído, ou o endereço está errado."
          action={
            <Link href="/admin">
              <Button size="sm" variant="secondary">
                Voltar à visão geral
              </Button>
            </Link>
          }
        />
      </Card>
    </>
  );
}
