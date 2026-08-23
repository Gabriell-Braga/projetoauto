import Link from "next/link";
import { ArrowRight, Gauge, MapPin, Phone } from "lucide-react";
import { PhotoGallery } from "@/templates/shared/gallery";
import { BODY_TYPE_LABELS, FUEL_LABELS, TRANSMISSION_LABELS } from "@/lib/catalog/labels";
import type {
  ContactProps,
  HomeProps,
  ListingProps,
  SiteData,
  SiteLinks,
  StockFacets,
  TemplateModule,
  VehicleDetailProps,
  VehicleView,
} from "@/templates/contract";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

/* ------------------------------------------------------------------ */
/* Estrutura                                                           */
/* ------------------------------------------------------------------ */

function Header({ site, links }: { site: SiteData; links: SiteLinks }) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-neutral-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4">
        <Link href={links.home} className="flex items-center gap-3">
          {site.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={site.logoUrl} alt={site.name} className="h-9 w-auto object-contain" />
          ) : (
            <span
              className="flex h-9 w-9 items-center justify-center rounded text-sm font-black"
              style={{
                backgroundColor: "var(--site-primary)",
                color: "var(--site-primary-foreground)",
              }}
            >
              {site.name.charAt(0)}
            </span>
          )}
          <span
            className="text-sm font-black uppercase tracking-[0.2em] text-white"
            style={{ fontFamily: "var(--site-font-heading)" }}
          >
            {site.name}
          </span>
        </Link>

        <nav className="flex items-center gap-1 text-xs font-semibold uppercase tracking-widest">
          <Link href={links.stock} className="px-3 py-2 text-white/60 transition-colors hover:text-white">
            Estoque
          </Link>
          <Link href={links.contact} className="px-3 py-2 text-white/60 transition-colors hover:text-white">
            Contato
          </Link>
          {site.contact.whatsappDigits ? (
            <a
              href={links.whatsapp(`Olá! Vim pelo site da ${site.name}.`) ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 px-5 py-2.5 text-xs font-bold uppercase tracking-widest"
              style={{
                backgroundColor: "var(--site-primary)",
                color: "var(--site-primary-foreground)",
              }}
            >
              WhatsApp
            </a>
          ) : null}
        </nav>
      </div>
    </header>
  );
}

function Footer({ site, links }: { site: SiteData; links: SiteLinks }) {
  return (
    <footer className="mt-20 border-t border-white/10 bg-black">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-3">
        <div>
          <p
            className="text-sm font-black uppercase tracking-[0.2em] text-white"
            style={{ fontFamily: "var(--site-font-heading)" }}
          >
            {site.name}
          </p>
          {site.contact.address.full ? (
            <p className="mt-3 flex items-start gap-2 text-sm text-white/50">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
              {site.contact.address.full}
            </p>
          ) : null}
        </div>

        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-white/40">Contato</p>
          <ul className="space-y-2 text-sm text-white/60">
            {site.contact.phone ? (
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                {site.contact.phone}
              </li>
            ) : null}
            {site.contact.email ? <li>{site.contact.email}</li> : null}
            {site.contact.whatsappDigits ? (
              <li>
                <a
                  href={links.whatsapp(`Olá! Vim pelo site da ${site.name}.`) ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white"
                >
                  WhatsApp {site.contact.whatsapp}
                </a>
              </li>
            ) : null}
          </ul>
        </div>

        <div>
          {site.contact.businessHours.length > 0 ? (
            <>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-white/40">
                Horários
              </p>
              <ul className="space-y-1 text-sm text-white/60">
                {site.contact.businessHours.map((hour) => (
                  <li key={hour.weekday}>
                    {WEEKDAYS[hour.weekday]}{" "}
                    {hour.open && hour.close ? `${hour.open}–${hour.close}` : "fechado"}
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-5 text-center text-xs text-white/30">
        © {new Date().getFullYear()} {site.name}
      </div>
    </footer>
  );
}

function Shell({
  site,
  links,
  children,
}: {
  site: SiteData;
  links: SiteLinks;
  children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-screen bg-neutral-950 text-white"
      style={{ fontFamily: "var(--site-font-body)" }}
    >
      <Header site={site} links={links} />
      <main>{children}</main>
      <Footer site={site} links={links} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Peças                                                               */
/* ------------------------------------------------------------------ */

function VehicleCard({ vehicle, links }: { vehicle: VehicleView; links: SiteLinks }) {
  return (
    <Link
      href={links.vehicle(vehicle.slug)}
      className="group relative block overflow-hidden border border-white/10 bg-neutral-900 transition-all hover:border-white/25"
    >
      <div className="relative aspect-16/10 overflow-hidden bg-neutral-800">
        {vehicle.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={vehicle.coverUrl}
            alt={vehicle.title}
            className="h-full w-full object-cover opacity-90 transition-all duration-500 group-hover:scale-105 group-hover:opacity-100"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-white/30">
            Sem foto
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent" />
        {vehicle.status === "reserved" ? (
          <span className="absolute right-3 top-3 bg-amber-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-black">
            Reservado
          </span>
        ) : null}
      </div>

      <div className="p-4">
        <h3
          className="line-clamp-1 text-sm font-bold uppercase tracking-wide text-white"
          style={{ fontFamily: "var(--site-font-heading)" }}
        >
          {vehicle.brand} {vehicle.model}
        </h3>
        {vehicle.version ? (
          <p className="line-clamp-1 text-xs text-white/40">{vehicle.version}</p>
        ) : null}

        <div className="mt-3 flex items-center gap-3 text-[11px] uppercase tracking-wider text-white/40">
          <span>{vehicle.yearLabel}</span>
          <span className="h-px w-3 bg-white/20" />
          <span>{vehicle.mileageLabel}</span>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p
            className="text-lg font-black"
            style={{ color: "var(--site-primary)", fontFamily: "var(--site-font-heading)" }}
          >
            {vehicle.priceLabel}
          </p>
          <ArrowRight className="h-4 w-4 text-white/30 transition-transform group-hover:translate-x-1 group-hover:text-white" />
        </div>
      </div>
    </Link>
  );
}

function FilterForm({
  facets,
  filters,
  action,
}: {
  facets: StockFacets;
  filters: ListingProps["filters"];
  action: string;
}) {
  const fieldClass =
    "h-11 w-full border border-white/15 bg-neutral-900 px-3 text-sm text-white placeholder:text-white/30 focus:border-[var(--site-primary)] focus:outline-none";
  const labelClass = "mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-white/40";

  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div className="lg:col-span-2">
        <label className={labelClass} htmlFor="q">
          Buscar
        </label>
        <input
          id="q"
          name="q"
          defaultValue={filters.search ?? ""}
          placeholder="Marca, modelo ou versão"
          className={fieldClass}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="marca">
          Marca
        </label>
        <select id="marca" name="marca" defaultValue={filters.brand ?? ""} className={fieldClass}>
          <option value="">Todas</option>
          {facets.brands.map((item) => (
            <option key={item.brand} value={item.brand}>
              {item.brand}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass} htmlFor="cambio">
          Câmbio
        </label>
        <select
          id="cambio"
          name="cambio"
          defaultValue={filters.transmission ?? ""}
          className={fieldClass}
        >
          <option value="">Todos</option>
          {facets.transmissions.filter(Boolean).map((value) => (
            <option key={value} value={value!}>
              {TRANSMISSION_LABELS[value!]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass} htmlFor="combustivel">
          Combustível
        </label>
        <select
          id="combustivel"
          name="combustivel"
          defaultValue={filters.fuel ?? ""}
          className={fieldClass}
        >
          <option value="">Todos</option>
          {facets.fuels.filter(Boolean).map((value) => (
            <option key={value} value={value!}>
              {FUEL_LABELS[value!]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass} htmlFor="carroceria">
          Carroceria
        </label>
        <select
          id="carroceria"
          name="carroceria"
          defaultValue={filters.bodyType ?? ""}
          className={fieldClass}
        >
          <option value="">Todas</option>
          {facets.bodyTypes.filter(Boolean).map((value) => (
            <option key={value} value={value!}>
              {BODY_TYPE_LABELS[value!]}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={labelClass} htmlFor="precoMin">
            Preço mín.
          </label>
          <input
            id="precoMin"
            name="precoMin"
            inputMode="numeric"
            defaultValue={filters.priceMin ? filters.priceMin / 100 : ""}
            className={fieldClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="precoMax">
            Preço máx.
          </label>
          <input
            id="precoMax"
            name="precoMax"
            inputMode="numeric"
            defaultValue={filters.priceMax ? filters.priceMax / 100 : ""}
            className={fieldClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={labelClass} htmlFor="anoMin">
            Ano mín.
          </label>
          <input
            id="anoMin"
            name="anoMin"
            inputMode="numeric"
            defaultValue={filters.yearMin ?? ""}
            className={fieldClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="kmMax">
            KM máx.
          </label>
          <input
            id="kmMax"
            name="kmMax"
            inputMode="numeric"
            defaultValue={filters.kmMax ?? ""}
            className={fieldClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="ordem">
          Ordenar
        </label>
        <select id="ordem" name="ordem" defaultValue={filters.sort} className={fieldClass}>
          <option value="recentes">Mais recentes</option>
          <option value="preco-asc">Menor preço</option>
          <option value="preco-desc">Maior preço</option>
          <option value="km-asc">Menor km</option>
          <option value="ano-desc">Ano mais novo</option>
        </select>
      </div>

      <div className="flex items-end">
        <button
          type="submit"
          className="h-11 w-full text-xs font-bold uppercase tracking-widest"
          style={{
            backgroundColor: "var(--site-primary)",
            color: "var(--site-primary-foreground)",
          }}
        >
          Filtrar
        </button>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Páginas                                                             */
/* ------------------------------------------------------------------ */

function Home({ site, links, featured, latest, facets, totalVehicles }: HomeProps) {
  const banner = site.banners[0];

  return (
    <Shell site={site} links={links}>
      <section className="relative min-h-[70vh] overflow-hidden border-b border-white/10">
        {banner?.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={banner.imageUrl}
            alt={banner.title ?? ""}
            className="absolute inset-0 h-full w-full object-cover opacity-40"
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.08),transparent_60%)]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/60 to-transparent" />

        <div className="relative mx-auto flex min-h-[70vh] max-w-7xl flex-col justify-end px-4 pb-16 pt-24">
          <p
            className="mb-3 text-xs font-bold uppercase tracking-[0.35em]"
            style={{ color: "var(--site-primary)" }}
          >
            {totalVehicles} veículos no estoque
          </p>
          <h1
            className="max-w-3xl text-4xl font-black uppercase leading-[0.95] tracking-tight sm:text-6xl"
            style={{ fontFamily: "var(--site-font-heading)" }}
          >
            {banner?.title ?? "Máquinas selecionadas"}
          </h1>
          <p className="mt-4 max-w-xl text-base text-white/60">
            {banner?.subtitle ??
              `${site.name} — seminovos de procedência, revisados e prontos para rodar.`}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={banner?.ctaHref ?? links.stock}
              className="px-7 py-4 text-xs font-bold uppercase tracking-widest"
              style={{
                backgroundColor: "var(--site-primary)",
                color: "var(--site-primary-foreground)",
              }}
            >
              {banner?.ctaLabel ?? "Ver estoque"}
            </Link>
            {site.contact.whatsappDigits ? (
              <a
                href={links.whatsapp(`Olá! Vim pelo site da ${site.name}.`) ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="border border-white/25 px-7 py-4 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-white hover:text-black"
              >
                WhatsApp
              </a>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10">
        <FilterForm facets={facets} filters={{ sort: "recentes" }} action={links.stock} />
      </section>

      {featured.length > 0 ? (
        <section className="mx-auto max-w-7xl px-4 pb-14">
          <div className="mb-6 flex items-end justify-between border-b border-white/10 pb-4">
            <h2
              className="text-2xl font-black uppercase tracking-tight"
              style={{ fontFamily: "var(--site-font-heading)" }}
            >
              Destaques
            </h2>
            <Link
              href={links.stock}
              className="text-xs font-bold uppercase tracking-widest text-white/50 hover:text-white"
            >
              Ver todos
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((vehicle) => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} links={links} />
            ))}
          </div>
        </section>
      ) : null}

      {latest.length > 0 ? (
        <section className="mx-auto max-w-7xl px-4 pb-14">
          <div className="mb-6 border-b border-white/10 pb-4">
            <h2
              className="text-2xl font-black uppercase tracking-tight"
              style={{ fontFamily: "var(--site-font-heading)" }}
            >
              Últimas chegadas
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {latest.map((vehicle) => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} links={links} />
            ))}
          </div>
        </section>
      ) : null}

      {site.aboutText ? (
        <section className="border-t border-white/10 bg-black">
          <div className="mx-auto max-w-3xl px-4 py-16 text-center">
            <h2
              className="text-2xl font-black uppercase tracking-tight"
              style={{ fontFamily: "var(--site-font-heading)" }}
            >
              {site.aboutTitle ?? "Sobre nós"}
            </h2>
            <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-white/60">
              {site.aboutText}
            </p>
          </div>
        </section>
      ) : null}
    </Shell>
  );
}

function Listing({ site, links, vehicles, facets, filters, total, page, pageSize }: ListingProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function pageHref(target: number) {
    return links.stockWith({
      q: filters.search,
      marca: filters.brand,
      cambio: filters.transmission,
      combustivel: filters.fuel,
      carroceria: filters.bodyType,
      precoMin: filters.priceMin ? filters.priceMin / 100 : undefined,
      precoMax: filters.priceMax ? filters.priceMax / 100 : undefined,
      anoMin: filters.yearMin,
      kmMax: filters.kmMax,
      ordem: filters.sort,
      pagina: target,
    });
  }

  return (
    <Shell site={site} links={links}>
      <div className="mx-auto max-w-7xl px-4 py-10">
        <h1
          className="text-3xl font-black uppercase tracking-tight"
          style={{ fontFamily: "var(--site-font-heading)" }}
        >
          Estoque
        </h1>
        <p className="mt-1 text-xs uppercase tracking-widest text-white/40">
          {total} veículos encontrados
        </p>

        <div className="my-8">
          <FilterForm facets={facets} filters={filters} action={links.stock} />
        </div>

        {vehicles.length === 0 ? (
          <div className="border border-dashed border-white/15 px-6 py-20 text-center">
            <p className="text-base font-bold uppercase tracking-wide">Nada encontrado</p>
            <p className="mt-2 text-sm text-white/50">
              Ajuste os filtros ou chame a gente no WhatsApp que a gente busca pra você.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {vehicles.map((vehicle) => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} links={links} />
            ))}
          </div>
        )}

        {totalPages > 1 ? (
          <div className="mt-10 flex items-center justify-center gap-5 text-xs font-bold uppercase tracking-widest">
            {page > 1 ? (
              <Link href={pageHref(page - 1)} className="text-white/60 hover:text-white">
                Anterior
              </Link>
            ) : null}
            <span className="text-white/30">
              {page} / {totalPages}
            </span>
            {page < totalPages ? (
              <Link href={pageHref(page + 1)} className="text-white/60 hover:text-white">
                Próxima
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>
    </Shell>
  );
}

function VehicleDetail({ site, links, vehicle, related, leadForm }: VehicleDetailProps) {
  const specs = [
    { label: "Ano", value: vehicle.yearLabel },
    { label: "KM", value: vehicle.mileageLabel },
    { label: "Câmbio", value: vehicle.transmissionLabel },
    { label: "Combustível", value: vehicle.fuelLabel },
    { label: "Carroceria", value: vehicle.bodyTypeLabel },
    { label: "Cor", value: vehicle.color },
    { label: "Portas", value: vehicle.doors ? `${vehicle.doors}` : null },
    { label: "Final placa", value: vehicle.licensePlateEnd },
  ].filter((spec) => Boolean(spec.value));

  return (
    <Shell site={site} links={links}>
      <div className="mx-auto max-w-7xl px-4 py-10">
        <nav className="mb-6 text-xs uppercase tracking-widest text-white/40">
          <Link href={links.stock} className="hover:text-white">
            Estoque
          </Link>
          <span className="mx-2">/</span>
          <span className="text-white/70">{vehicle.title}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr]">
          <div>
            <PhotoGallery photos={vehicle.photos} title={vehicle.title} tone="dark" />

            <div className="mt-10">
              <h2
                className="mb-4 border-b border-white/10 pb-3 text-lg font-black uppercase tracking-tight"
                style={{ fontFamily: "var(--site-font-heading)" }}
              >
                Ficha técnica
              </h2>
              <dl className="grid grid-cols-2 gap-px overflow-hidden border border-white/10 bg-white/10 sm:grid-cols-4">
                {specs.map((spec) => (
                  <div key={spec.label} className="bg-neutral-950 px-4 py-4">
                    <dt className="text-[10px] font-bold uppercase tracking-widest text-white/35">
                      {spec.label}
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-white">{spec.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {vehicle.options.length > 0 ? (
              <div className="mt-10">
                <h2
                  className="mb-4 border-b border-white/10 pb-3 text-lg font-black uppercase tracking-tight"
                  style={{ fontFamily: "var(--site-font-heading)" }}
                >
                  Opcionais
                </h2>
                <div className="flex flex-wrap gap-2">
                  {vehicle.options.map((option) => (
                    <span
                      key={option.key}
                      className="border border-white/15 px-3 py-1.5 text-xs uppercase tracking-wide text-white/70"
                    >
                      {option.label}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {vehicle.description ? (
              <div className="mt-10">
                <h2
                  className="mb-4 border-b border-white/10 pb-3 text-lg font-black uppercase tracking-tight"
                  style={{ fontFamily: "var(--site-font-heading)" }}
                >
                  Detalhes
                </h2>
                <p className="whitespace-pre-line text-sm leading-relaxed text-white/60">
                  {vehicle.description}
                </p>
              </div>
            ) : null}
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="border border-white/10 bg-neutral-900 p-6">
              <h1
                className="text-2xl font-black uppercase leading-tight tracking-tight"
                style={{ fontFamily: "var(--site-font-heading)" }}
              >
                {vehicle.brand} {vehicle.model}
              </h1>
              {vehicle.version ? (
                <p className="mt-1 text-sm text-white/40">{vehicle.version}</p>
              ) : null}

              <p
                className="mt-5 text-4xl font-black"
                style={{ color: "var(--site-primary)", fontFamily: "var(--site-font-heading)" }}
              >
                {vehicle.priceLabel}
              </p>

              <div className="mt-4 flex items-center gap-4 text-xs uppercase tracking-widest text-white/40">
                <span>{vehicle.yearLabel}</span>
                <span className="flex items-center gap-1">
                  <Gauge className="h-3.5 w-3.5" />
                  {vehicle.mileageLabel}
                </span>
              </div>

              {site.contact.whatsappDigits ? (
                <a
                  href={
                    links.whatsapp(
                      `Olá! Tenho interesse no ${vehicle.title} ${vehicle.yearLabel} (${vehicle.priceLabel}) anunciado no site.`,
                    ) ?? "#"
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 block py-4 text-center text-xs font-bold uppercase tracking-widest"
                  style={{
                    backgroundColor: "var(--site-primary)",
                    color: "var(--site-primary-foreground)",
                  }}
                >
                  Chamar no WhatsApp
                </a>
              ) : null}

              <div className="mt-6 border-t border-white/10 pt-6">{leadForm}</div>
            </div>
          </aside>
        </div>

        {related.length > 0 ? (
          <section className="mt-16">
            <h2
              className="mb-6 border-b border-white/10 pb-4 text-2xl font-black uppercase tracking-tight"
              style={{ fontFamily: "var(--site-font-heading)" }}
            >
              Você também pode gostar
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((item) => (
                <VehicleCard key={item.id} vehicle={item} links={links} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </Shell>
  );
}

function Contact({ site, links }: ContactProps) {
  return (
    <Shell site={site} links={links}>
      <div className="mx-auto max-w-4xl px-4 py-14">
        <h1
          className="text-3xl font-black uppercase tracking-tight"
          style={{ fontFamily: "var(--site-font-heading)" }}
        >
          Contato
        </h1>

        {site.aboutText ? (
          <div className="mt-8 border border-white/10 bg-neutral-900 p-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-white/60">
              {site.aboutTitle ?? "Sobre nós"}
            </h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-white/60">
              {site.aboutText}
            </p>
          </div>
        ) : null}

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="border border-white/10 bg-neutral-900 p-6">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-white/60">
              Fale com a gente
            </h2>
            <ul className="space-y-2 text-sm text-white/70">
              {site.contact.phone ? <li>Telefone: {site.contact.phone}</li> : null}
              {site.contact.whatsapp ? <li>WhatsApp: {site.contact.whatsapp}</li> : null}
              {site.contact.email ? <li>E-mail: {site.contact.email}</li> : null}
            </ul>
            {site.contact.whatsappDigits ? (
              <a
                href={links.whatsapp(`Olá! Vim pelo site da ${site.name}.`) ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-block px-5 py-3 text-xs font-bold uppercase tracking-widest"
                style={{
                  backgroundColor: "var(--site-primary)",
                  color: "var(--site-primary-foreground)",
                }}
              >
                WhatsApp
              </a>
            ) : null}
          </div>

          <div className="border border-white/10 bg-neutral-900 p-6">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-white/60">
              Onde estamos
            </h2>
            {site.contact.address.full ? (
              <p className="text-sm text-white/70">{site.contact.address.full}</p>
            ) : (
              <p className="text-sm text-white/40">Endereço não informado.</p>
            )}
            {site.contact.mapsUrl ? (
              <a
                href={site.contact.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block text-xs font-bold uppercase tracking-widest"
                style={{ color: "var(--site-primary)" }}
              >
                Ver no mapa
              </a>
            ) : null}

            {site.contact.businessHours.length > 0 ? (
              <ul className="mt-6 space-y-1 text-sm text-white/60">
                {site.contact.businessHours.map((hour) => (
                  <li key={hour.weekday}>
                    {WEEKDAYS[hour.weekday]}{" "}
                    {hour.open && hour.close ? `${hour.open}–${hour.close}` : "fechado"}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </div>
    </Shell>
  );
}

const template: TemplateModule = { Home, Listing, VehicleDetail, Contact };
export default template;
