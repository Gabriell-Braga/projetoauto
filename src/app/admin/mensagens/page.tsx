import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/shell";
import { requireTenantPage } from "@/lib/auth/guards";
import { can } from "@/lib/auth/rbac";
import { ensureTemplates } from "@/lib/services/message-templates";
import { TemplatesPanel } from "./templates-panel";

export const metadata: Metadata = { title: "Mensagens" };
export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  const context = await requireTenantPage("leads:read");
  const templates = await ensureTemplates(context.tenant.id);

  return (
    <>
      <PageHeader
        title="Mensagens"
        description="Modelos prontos para o WhatsApp. O vendedor escolhe na ficha do lead e o sistema preenche os dados."
      />
      <TemplatesPanel
        templates={templates.map((template) => ({
          id: template.id,
          name: template.name,
          body: template.body,
          active: template.active,
        }))}
        canWrite={can(context.role, "tenant:settings")}
        example={{
          nome: "Ana Paula Ribeiro",
          veiculo: "Chevrolet Onix 1.0 LT 2022",
          preco: "R$ 79.900,00",
          vendedor: context.user.name,
          revenda: context.tenant.name,
        }}
      />
    </>
  );
}
