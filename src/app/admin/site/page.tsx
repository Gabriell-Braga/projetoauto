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
import { DEFAULT_THEME } from "@projetoauto/site-kit/contract";
import { listDomains } from "@/lib/services/domains";
import { hostingReady } from "@/lib/integrations/vercel";
import { getTemplate } from "@projetoauto/site-kit/registry";
import { ContactPanel } from "./contact-panel";
import { ContentPanel } from "./content-panel";
import { IdentityPanel } from "./identity-panel";
import { DomainsPanel } from "./domains-panel";
import { PagesPanel } from "./pages-panel";

export const metadata: Metadata = { title: "Site" };
export const dynamic = "force-dynamic";

const TABS = [
  { key: "identidade", label: "Identidade" },
  { key: "contato", label: "Contato" },
  { key: "conteudo", label: "Conteúdo" },
  { key: "paginas", label: "Páginas" },
  { key: "dominio", label: "Domínio" },
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

  const domains = tab === "dominio" ? await listDomains(context.tenant.id) : [];

  const template = getTemplate(context.tenant.templateId);

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

      {tab === "paginas" ? (
        <PagesPanel
          readOnly={readOnly}
          hasFinancing={Boolean(template.Financing)}
          hasSellCar={Boolean(template.SellCar)}
          initial={{
            stats: site?.stats ?? [],
            reviews: (site?.reviews ?? []).map((review) => ({
              rating: review.rating,
              text: review.text,
              author: review.author ?? "",
            })),
            downPaymentPercent: site?.financing?.downPaymentPercent ?? 20,
            terms: site?.financing?.terms ?? [24, 36, 48, 60],
            legalPrivacy: site?.legalPrivacy ?? "",
            legalTerms: site?.legalTerms ?? "",
          }}
        />
      ) : null}

      {tab === "dominio" ? (
        <DomainsPanel
          readOnly={readOnly}
          hostingReady={hostingReady()}
          domains={domains.map((row) => ({
            id: row.id,
            domain: row.domain,
            status: row.status,
            isPrimary: row.isPrimary,
            pendingRecords: row.pendingRecords,
            lastError: row.lastError,
            lastCheckedAt: row.lastCheckedAt ? row.lastCheckedAt.toISOString() : null,
          }))}
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
