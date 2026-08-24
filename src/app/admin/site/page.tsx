import type { Metadata } from "next";
import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { PageHeader } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";
import { getDb } from "@/db";
import { tenantBanners, tenantSites } from "@/db/schema";
import { requireTenantPage } from "@/lib/auth/guards";
import { can } from "@/lib/auth/rbac";
import { tenantPublicPath } from "@/lib/tenant/resolveTenant";
import { Tabs } from "@/components/ui/tabs";
import { DEFAULT_THEME } from "@/templates/contract";
import { ContactPanel } from "./contact-panel";
import { ContentPanel } from "./content-panel";
import { IdentityPanel } from "./identity-panel";

export const metadata: Metadata = { title: "Site" };
export const dynamic = "force-dynamic";

const TABS = [
  { key: "identidade", label: "Identidade" },
  { key: "contato", label: "Contato" },
  { key: "conteudo", label: "Conteúdo" },
] as const;

export default async function SitePage({
  searchParams,
}: {
  searchParams: Promise<{ aba?: string }>;
}) {
  const context = await requireTenantPage("site:read");
  const { aba } = await searchParams;
  const tab = TABS.some((item) => item.key === aba) ? aba! : "identidade";

  const db = await getDb();
  const siteRows = await db
    .select()
    .from(tenantSites)
    .where(eq(tenantSites.tenantId, context.tenant.id))
    .limit(1);
  const site = siteRows[0];

  const banners =
    tab === "conteudo"
      ? await db
          .select()
          .from(tenantBanners)
          .where(eq(tenantBanners.tenantId, context.tenant.id))
          .orderBy(asc(tenantBanners.position))
      : [];

  const readOnly = !can(context.role, "site:write") || context.access !== "full";

  return (
    <>
      <PageHeader
        title="Site"
        description="Configure a identidade, os dados de contato e os textos do seu site."
        actions={
          <Link href={tenantPublicPath(context.tenant.slug)} target="_blank">
            <Button variant="secondary">Ver meu site</Button>
          </Link>
        }
      />

      <Tabs
        active={tab}
        items={TABS.map((item) => ({
          key: item.key,
          label: item.label,
          href: `/admin/site?aba=${item.key}`,
        }))}
      />

      {tab === "identidade" ? (
        <IdentityPanel
          readOnly={readOnly}
          initial={{
            templateId: context.tenant.templateId,
            logoKey: site?.logoKey ?? null,
            theme: {
              primary: site?.theme?.primary ?? DEFAULT_THEME.primary,
              primaryForeground:
                site?.theme?.primaryForeground ?? DEFAULT_THEME.primaryForeground,
              accent: site?.theme?.accent ?? DEFAULT_THEME.accent,
              surface: site?.theme?.surface ?? DEFAULT_THEME.surface,
              fontHeading: site?.theme?.fontHeading ?? DEFAULT_THEME.fontHeading,
              fontBody: site?.theme?.fontBody ?? DEFAULT_THEME.fontBody,
            },
          }}
        />
      ) : null}

      {tab === "contato" ? (
        <ContactPanel
          readOnly={readOnly}
          initial={{
            phone: site?.phone ?? "",
            whatsapp: site?.whatsapp ?? "",
            email: site?.email ?? "",
            addressStreet: site?.addressStreet ?? "",
            addressNumber: site?.addressNumber ?? "",
            addressComplement: site?.addressComplement ?? "",
            addressDistrict: site?.addressDistrict ?? "",
            addressCity: site?.addressCity ?? "",
            addressState: site?.addressState ?? "",
            addressZip: site?.addressZip ?? "",
            mapsUrl: site?.mapsUrl ?? "",
            businessHours: site?.businessHours ?? [],
            social: site?.social ?? {},
          }}
        />
      ) : null}

      {tab === "conteudo" ? (
        <ContentPanel
          readOnly={readOnly}
          initial={{
            aboutTitle: site?.aboutTitle ?? "",
            aboutText: site?.aboutText ?? "",
            gtmCode: site?.gtmCode ?? "",
            gtmInherited: !site?.gtmCode,
          }}
          banners={banners.map((banner) => ({
            id: banner.id,
            imageKey: banner.imageKey,
            title: banner.title,
            subtitle: banner.subtitle,
            ctaLabel: banner.ctaLabel,
            ctaHref: banner.ctaHref,
            active: banner.active,
          }))}
        />
      ) : null}
    </>
  );
}
