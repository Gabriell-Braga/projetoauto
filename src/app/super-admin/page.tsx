import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/shell";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Painel Geral" };
export const dynamic = "force-dynamic";

export default function SuperAdminHome() {
  return (
    <>
      <PageHeader
        title="Visão geral"
        description="Acompanhe as revendas, a adimplência e as ações da plataforma."
      />
      <Card>
        <CardContent>
          <p className="text-sm text-ink-500">
            Os indicadores e a gestão de revendas entram na Fase 2.
          </p>
        </CardContent>
      </Card>
    </>
  );
}
