import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/shell";
import { FeatureLocked } from "@/components/admin/feature-locked";
import { requireTenantPage } from "@/lib/auth/guards";
import { tenantHasFeature } from "@/lib/api/feature-guard";
import { listApiKeys, listTenantWebhooks } from "@/lib/services/api-access";
import { IntegrationsPanel } from "./integrations-panel";

export const metadata: Metadata = { title: "API e webhooks" };
export const dynamic = "force-dynamic";

export default async function IntegrationsPage() {
  const context = await requireTenantPage("api:manage");

  if (!(await tenantHasFeature(context.tenant.id, "api_webhooks"))) {
    return (
      <>
        <PageHeader title="API e webhooks" description="Conecte outros sistemas à sua operação." />
        <FeatureLocked
          title="API e webhooks não estão no plano desta revenda"
          description="Eles permitem ler o estoque, receber leads de outros sistemas e ser avisado quando algo acontece aqui."
        />
      </>
    );
  }

  const [keys, webhooks] = await Promise.all([
    listApiKeys(context.tenant.id),
    listTenantWebhooks(context.tenant.id),
  ]);

  return (
    <>
      <PageHeader
        title="API e webhooks"
        description="Chaves para ler seus dados e avisos automáticos quando algo muda."
      />
      <IntegrationsPanel
        keys={keys.map((key) => ({
          id: key.id,
          name: key.name,
          prefix: key.prefix,
          lastUsedAt: key.lastUsedAt?.toISOString() ?? null,
          revokedAt: key.revokedAt?.toISOString() ?? null,
          createdAt: key.createdAt.toISOString(),
        }))}
        webhooks={webhooks.map((hook) => ({
          id: hook.id,
          url: hook.url,
          events: hook.events ?? [],
          active: hook.active,
          lastStatus: hook.lastStatus,
          lastError: hook.lastError,
          lastAttemptAt: hook.lastAttemptAt?.toISOString() ?? null,
          failureCount: hook.failureCount,
        }))}
      />
    </>
  );
}
