import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/shell";
import { FeatureLocked } from "@/components/admin/feature-locked";
import { requireTenantPage } from "@/lib/auth/guards";
import { can } from "@/lib/auth/rbac";
import { tenantHasFeature } from "@/lib/api/feature-guard";
import { listStores } from "@/lib/services/stores";
import { StoresPanel } from "./stores-panel";

export const metadata: Metadata = { title: "Unidades" };
export const dynamic = "force-dynamic";

export default async function StoresPage() {
  const context = await requireTenantPage("vehicles:read");

  if (!(await tenantHasFeature(context.tenant.id, "gestao_multiunidade"))) {
    return (
      <>
        <PageHeader title="Unidades" description="Lojas e pátios da revenda." />
        <FeatureLocked
          title="Gestão multiunidade não está no plano desta revenda"
          description="Ela separa estoque, equipe e leads por loja, e permite medir cada unidade isoladamente."
        />
      </>
    );
  }

  const stores = await listStores(context.tenant.id);

  return (
    <>
      <PageHeader
        title="Unidades"
        description="Cada loja tem endereço e contato próprios. Estoque e equipe podem ser divididos entre elas."
      />
      <StoresPanel
        stores={stores.map((store) => ({
          id: store.id,
          name: store.name,
          slug: store.slug,
          whatsapp: store.whatsapp,
          phone: store.phone,
          email: store.email,
          addressZip: store.addressZip,
          addressStreet: store.addressStreet,
          addressNumber: store.addressNumber,
          addressComplement: store.addressComplement,
          addressDistrict: store.addressDistrict,
          addressCity: store.addressCity,
          addressState: store.addressState,
          isDefault: store.isDefault,
          active: store.active,
        }))}
        canWrite={can(context.role, "stores:write")}
      />
    </>
  );
}
