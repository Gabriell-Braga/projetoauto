import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import {
  tenantBanners,
  tenantSites,
  tenants,
  type PhotoVariants,
  type Vehicle,
  type VehiclePhoto,
} from "@/db/schema";
import { cacheKeys, cached } from "@/lib/cache";
import {
  BODY_TYPE_LABELS,
  FUEL_LABELS,
  TRANSMISSION_LABELS,
  VEHICLE_STATUS_LABELS,
} from "@/lib/catalog/labels";
import { OPTION_LABELS, VEHICLE_OPTIONS } from "@/lib/catalog/options";
import { mediaUrl } from "@/lib/paths";
import { tenantPublicPath } from "@/lib/tenant/resolveTenant";
import { formatCurrency, formatNumber, onlyDigits } from "@/lib/utils";
import {
  DEFAULT_THEME,
  type SiteData,
  type SiteLinks,
  type ThemeTokens,
  type VehicleView,
} from "@/templates/contract";
import type { VehicleListItem } from "./vehicles";

/** Estrutura serializável guardada no KV (datas/URLs já resolvidas). */
type CachedSite = SiteData & { gtmCode: string | null; templateId: string };

const SITE_TTL = 120;

export async function getSiteData(slug: string): Promise<CachedSite | null> {
  return cached(cacheKeys.tenantSite(slug), SITE_TTL, () => loadSiteData(slug));
}

async function loadSiteData(slug: string): Promise<CachedSite | null> {
  const db = await getDb();

  const rows = await db
    .select({ tenant: tenants, site: tenantSites })
    .from(tenants)
    .leftJoin(tenantSites, eq(tenantSites.tenantId, tenants.id))
    .where(eq(tenants.slug, slug))
    .limit(1);

  const row = rows[0];
  if (!row || row.tenant.status === "deleted") return null;

  const banners = await db
    .select()
    .from(tenantBanners)
    .where(and(eq(tenantBanners.tenantId, row.tenant.id), eq(tenantBanners.active, true)))
    .orderBy(asc(tenantBanners.position));

  const site = row.site;
  const theme: ThemeTokens = { ...DEFAULT_THEME, ...(site?.theme ?? {}) };

  const addressParts = [
    [site?.addressStreet, site?.addressNumber].filter(Boolean).join(", "),
    site?.addressComplement,
    site?.addressDistrict,
    [site?.addressCity, site?.addressState].filter(Boolean).join(" - "),
    site?.addressZip,
  ].filter(Boolean);

  return {
    tenantId: row.tenant.id,
    templateId: row.tenant.templateId,
    gtmCode: site?.gtmCode ?? null,
    name: row.tenant.name,
    slug: row.tenant.slug,
    logoUrl: mediaUrl(site?.logoKey),
    theme,
    aboutTitle: site?.aboutTitle ?? null,
    aboutText: site?.aboutText ?? null,
    contact: {
      phone: site?.phone ?? null,
      whatsapp: site?.whatsapp ?? null,
      whatsappDigits: site?.whatsapp ? normalizeWhatsapp(site.whatsapp) : null,
      email: site?.email ?? null,
      address: {
        street: site?.addressStreet ?? null,
        number: site?.addressNumber ?? null,
        complement: site?.addressComplement ?? null,
        district: site?.addressDistrict ?? null,
        city: site?.addressCity ?? null,
        state: site?.addressState ?? null,
        zip: site?.addressZip ?? null,
        full: addressParts.length > 0 ? addressParts.join(" · ") : null,
      },
      mapsUrl: site?.mapsUrl ?? null,
      businessHours: site?.businessHours ?? [],
      social: site?.social ?? {},
    },
    banners: banners.map((banner) => ({
      id: banner.id,
      imageUrl: mediaUrl(banner.imageKey),
      imageUrlMobile: mediaUrl(banner.imageKeyMobile),
      title: banner.title,
      subtitle: banner.subtitle,
      ctaLabel: banner.ctaLabel,
      ctaHref: banner.ctaHref,
    })),
  };
}

/** WhatsApp precisa de DDI para o link wa.me funcionar. */
export function normalizeWhatsapp(value: string): string {
  const digits = onlyDigits(value);
  if (digits.length <= 11) return `55${digits}`;
  return digits;
}

export function buildSiteLinks(slug: string, whatsappDigits: string | null): SiteLinks {
  return {
    home: tenantPublicPath(slug),
    stock: tenantPublicPath(slug, "/estoque"),
    contact: tenantPublicPath(slug, "/contato"),
    vehicle: (vehicleSlug: string) => tenantPublicPath(slug, `/veiculo/${vehicleSlug}`),
    stockWith: (params) => {
      const query = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== "") query.set(key, String(value));
      }
      const suffix = query.toString();
      return tenantPublicPath(slug, suffix ? `/estoque?${suffix}` : "/estoque");
    },
    whatsapp: (message: string) =>
      whatsappDigits
        ? `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(message)}`
        : null,
  };
}

function vehicleTitle(vehicle: { brand: string; model: string; version?: string | null }): string {
  return [vehicle.brand, vehicle.model, vehicle.version].filter(Boolean).join(" ");
}

function priceLabel(priceCents: number, onRequest: boolean): string {
  return onRequest || priceCents <= 0 ? "Sob consulta" : formatCurrency(priceCents);
}

/** Card de listagem — usa só o que já vem na linha do veículo (sem N+1 de fotos). */
export function toVehicleCard(vehicle: VehicleListItem): VehicleView {
  return {
    id: vehicle.id,
    slug: vehicle.slug,
    title: vehicleTitle(vehicle),
    brand: vehicle.brand,
    model: vehicle.model,
    version: vehicle.version,
    yearManufacture: vehicle.yearManufacture,
    yearModel: vehicle.yearModel,
    yearLabel: `${vehicle.yearManufacture}/${vehicle.yearModel}`,
    mileageKm: vehicle.mileageKm,
    mileageLabel: `${formatNumber(vehicle.mileageKm)} km`,
    priceCents: vehicle.priceCents,
    priceOnRequest: vehicle.priceOnRequest,
    priceLabel: priceLabel(vehicle.priceCents, vehicle.priceOnRequest),
    status: vehicle.status,
    statusLabel: VEHICLE_STATUS_LABELS[vehicle.status],
    featured: vehicle.featured,
    transmission: null,
    transmissionLabel: null,
    fuel: null,
    fuelLabel: null,
    bodyType: null,
    bodyTypeLabel: null,
    color: null,
    doors: null,
    licensePlateEnd: null,
    options: [],
    description: null,
    coverUrl: mediaUrl(vehicle.coverPhotoKey),
    photos: [],
  };
}

export function toVehicleDetail(vehicle: Vehicle, photos: VehiclePhoto[]): VehicleView {
  const optionKeys = vehicle.options ?? [];

  return {
    id: vehicle.id,
    slug: vehicle.slug,
    title: vehicleTitle(vehicle),
    brand: vehicle.brand,
    model: vehicle.model,
    version: vehicle.version,
    yearManufacture: vehicle.yearManufacture,
    yearModel: vehicle.yearModel,
    yearLabel: `${vehicle.yearManufacture}/${vehicle.yearModel}`,
    mileageKm: vehicle.mileageKm,
    mileageLabel: `${formatNumber(vehicle.mileageKm)} km`,
    priceCents: vehicle.priceCents,
    priceOnRequest: vehicle.priceOnRequest,
    priceLabel: priceLabel(vehicle.priceCents, vehicle.priceOnRequest),
    status: vehicle.status,
    statusLabel: VEHICLE_STATUS_LABELS[vehicle.status],
    featured: vehicle.featured,
    transmission: vehicle.transmission,
    transmissionLabel: vehicle.transmission
      ? TRANSMISSION_LABELS[vehicle.transmission]
      : null,
    fuel: vehicle.fuel,
    fuelLabel: vehicle.fuel ? FUEL_LABELS[vehicle.fuel] : null,
    bodyType: vehicle.bodyType,
    bodyTypeLabel: vehicle.bodyType ? BODY_TYPE_LABELS[vehicle.bodyType] : null,
    color: vehicle.color,
    doors: vehicle.doors,
    licensePlateEnd: vehicle.licensePlateEnd,
    options: optionKeys.map((key) => ({
      key,
      label: OPTION_LABELS[key] ?? key,
      group: VEHICLE_OPTIONS.find((option) => option.key === key)?.group ?? "Outros",
    })),
    description: vehicle.description,
    coverUrl: mediaUrl(vehicle.coverPhotoKey),
    photos: photos.map((photo) => {
      const variants = photo.variants as PhotoVariants;
      return {
        id: photo.id,
        thumb: mediaUrl(variants.thumb) ?? "",
        card: mediaUrl(variants.card) ?? "",
        full: mediaUrl(variants.full) ?? "",
      };
    }),
  };
}
