import { and, desc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { vehicles, type VehicleStatus } from "@/db/schema";
import { getOrigin } from "@/lib/seo/urls";
import { tenantPublicPath } from "@/lib/tenant/resolveTenant";
import { getTenantCoreBySlug, isPublicSiteAvailable } from "@/lib/tenant/service";

export const dynamic = "force-dynamic";

const PUBLIC_STATUSES: VehicleStatus[] = ["available", "reserved"];
const MAX_URLS = 2000;

/** Sitemap por revenda (a tenancy é por path, então cada slug tem o seu). */
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const tenant = await getTenantCoreBySlug(slug);
  if (!tenant || !isPublicSiteAvailable(tenant)) {
    return new Response("Não encontrado", { status: 404 });
  }

  const db = await getDb();
  const rows = await db
    .select({ slug: vehicles.slug, updatedAt: vehicles.updatedAt })
    .from(vehicles)
    .where(and(eq(vehicles.tenantId, tenant.id), inArray(vehicles.status, PUBLIC_STATUSES)))
    .orderBy(desc(vehicles.updatedAt))
    .limit(MAX_URLS);

  const origin = await getOrigin();
  const now = new Date().toISOString();

  const entries = [
    { loc: tenantPublicPath(slug), lastmod: now, priority: "1.0", changefreq: "daily" },
    { loc: tenantPublicPath(slug, "/estoque"), lastmod: now, priority: "0.9", changefreq: "daily" },
    { loc: tenantPublicPath(slug, "/contato"), lastmod: now, priority: "0.5", changefreq: "monthly" },
    ...rows.map((row) => ({
      loc: tenantPublicPath(slug, `/veiculo/${row.slug}`),
      lastmod: row.updatedAt.toISOString(),
      priority: "0.8",
      changefreq: "weekly",
    })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (entry) => `  <url>
    <loc>${escapeXml(`${origin}${entry.loc}`)}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`,
  )
  .join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: { "content-type": "application/xml; charset=utf-8" },
  });
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
