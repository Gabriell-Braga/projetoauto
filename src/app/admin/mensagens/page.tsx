import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/shell";
import { requireTenantPage } from "@/lib/auth/guards";
import { can } from "@/lib/auth/rbac";
import { ensureTemplates } from "@/lib/services/message-templates";
import { getWhatsappConnection } from "@/lib/services/whatsapp";
import { tenantHasFeature } from "@/lib/api/feature-guard";
import { isVaultConfigured } from "@/lib/security/vault";
import { TemplatesPanel } from "./templates-panel";
import { WhatsappConnection } from "./whatsapp-connection";

export const metadata: Metadata = { title: "Mensagens" };
export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  const context = await requireTenantPage("leads:read");
  const [templates, connection, hasWhatsapp] = await Promise.all([
    ensureTemplates(context.tenant.id),
    getWhatsappConnection(context.tenant.id),
    tenantHasFeature(context.tenant.id, "whatsapp_integrado"),
  ]);

  return (
    <>
      <PageHeader
        title="Mensagens"
        description="Modelos prontos para o WhatsApp. O vendedor escolhe na ficha do lead e o sistema preenche os dados."
      />
      {hasWhatsapp ? (
        <WhatsappConnection
          vaultReady={isVaultConfigured()}
          canWrite={can(context.role, "tenant:settings")}
          connection={
            connection
              ? {
                  phoneNumberId: connection.phoneNumberId,
                  wabaId: connection.wabaId,
                  displayPhone: connection.displayPhone,
                  status: connection.status,
                  lastError: connection.lastError,
                  lastInboundAt: connection.lastInboundAt?.toISOString() ?? null,
                }
              : null
          }
        />
      ) : null}

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
