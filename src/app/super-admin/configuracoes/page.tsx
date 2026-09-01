import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/shell";
import { requireSuperAdminPage } from "@/lib/auth/guards";
import { asaasEnvironment } from "@/lib/gateway/asaas";
import { getPlatformSettings } from "@/lib/plans/service";
import { SettingsForm } from "./settings-form";
import { WebhookHealth } from "./webhook-health";

export const metadata: Metadata = { title: "Configurações da plataforma" };
export const dynamic = "force-dynamic";

export default async function PlatformSettingsPage() {
  await requireSuperAdminPage();
  const settings = await getPlatformSettings();

  // só o ambiente, nunca a chave — o prefixo dela já diz sandbox ou produção
  const environment = process.env.ASAAS_API_KEY ? asaasEnvironment() : null;

  return (
    <>
      <PageHeader
        title="Configurações da plataforma"
        description="Multa, juros e período de teste sem depender de deploy."
      />
      <WebhookHealth />
      <SettingsForm settings={settings} gatewayEnvironment={environment} />
    </>
  );
}
