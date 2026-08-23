import type { SiteData, VehicleView } from "@/templates/contract";

/**
 * Dados estruturados schema.org.
 * AutoDealer identifica a revenda; Vehicle + Offer descreve cada anúncio.
 */

const WEEKDAY_SCHEMA = [
  "https://schema.org/Sunday",
  "https://schema.org/Monday",
  "https://schema.org/Tuesday",
  "https://schema.org/Wednesday",
  "https://schema.org/Thursday",
  "https://schema.org/Friday",
  "https://schema.org/Saturday",
];

const FUEL_SCHEMA: Record<string, string> = {
  flex: "Flex",
  gasolina: "Gasoline",
  etanol: "Ethanol",
  diesel: "Diesel",
  gnv: "NaturalGas",
  hibrido: "Hybrid",
  eletrico: "Electric",
};

const TRANSMISSION_SCHEMA: Record<string, string> = {
  manual: "Manual",
  automatico: "Automatic",
  automatizado: "AutomatedManual",
  cvt: "CVT",
};

export function autoDealerJsonLd(site: SiteData, siteUrl: string) {
  const address = site.contact.address;

  return {
    "@context": "https://schema.org",
    "@type": "AutoDealer",
    name: site.name,
    url: siteUrl,
    ...(site.logoUrl ? { logo: absolute(siteUrl, site.logoUrl) } : {}),
    ...(site.contact.phone ? { telephone: site.contact.phone } : {}),
    ...(site.contact.email ? { email: site.contact.email } : {}),
    ...(address.city
      ? {
          address: {
            "@type": "PostalAddress",
            streetAddress: [address.street, address.number].filter(Boolean).join(", ") || undefined,
            addressLocality: address.city,
            addressRegion: address.state ?? undefined,
            postalCode: address.zip ?? undefined,
            addressCountry: "BR",
          },
        }
      : {}),
    ...(site.contact.businessHours.length > 0
      ? {
          openingHoursSpecification: site.contact.businessHours
            .filter((hour) => hour.open && hour.close)
            .map((hour) => ({
              "@type": "OpeningHoursSpecification",
              dayOfWeek: WEEKDAY_SCHEMA[hour.weekday],
              opens: hour.open,
              closes: hour.close,
            })),
        }
      : {}),
    ...(Object.values(site.contact.social).filter(Boolean).length > 0
      ? { sameAs: Object.values(site.contact.social).filter(Boolean) }
      : {}),
  };
}

export function vehicleJsonLd(vehicle: VehicleView, site: SiteData, vehicleUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Vehicle",
    name: `${vehicle.title} ${vehicle.yearLabel}`,
    url: vehicleUrl,
    brand: { "@type": "Brand", name: vehicle.brand },
    model: vehicle.model,
    ...(vehicle.version ? { vehicleConfiguration: vehicle.version } : {}),
    vehicleModelDate: String(vehicle.yearModel),
    productionDate: String(vehicle.yearManufacture),
    mileageFromOdometer: {
      "@type": "QuantitativeValue",
      value: vehicle.mileageKm,
      unitCode: "KMT",
    },
    ...(vehicle.color ? { color: vehicle.color } : {}),
    ...(vehicle.doors ? { numberOfDoors: vehicle.doors } : {}),
    ...(vehicle.fuel ? { fuelType: FUEL_SCHEMA[vehicle.fuel] ?? vehicle.fuel } : {}),
    ...(vehicle.transmission
      ? { vehicleTransmission: TRANSMISSION_SCHEMA[vehicle.transmission] ?? vehicle.transmission }
      : {}),
    ...(vehicle.description ? { description: vehicle.description.slice(0, 500) } : {}),
    ...(vehicle.photos.length > 0
      ? { image: vehicle.photos.slice(0, 6).map((photo) => absolute(vehicleUrl, photo.full)) }
      : {}),
    offers: {
      "@type": "Offer",
      priceCurrency: "BRL",
      ...(vehicle.priceOnRequest || vehicle.priceCents <= 0
        ? {}
        : { price: (vehicle.priceCents / 100).toFixed(2) }),
      availability:
        vehicle.status === "available"
          ? "https://schema.org/InStock"
          : "https://schema.org/LimitedAvailability",
      itemCondition: "https://schema.org/UsedCondition",
      url: vehicleUrl,
      seller: { "@type": "AutoDealer", name: site.name },
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/** Transforma caminho relativo (ex.: /app/api/media/...) em URL absoluta. */
function absolute(baseUrl: string, path: string): string {
  if (path.startsWith("http")) return path;
  try {
    return new URL(path, baseUrl).toString();
  } catch {
    return path;
  }
}

export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
