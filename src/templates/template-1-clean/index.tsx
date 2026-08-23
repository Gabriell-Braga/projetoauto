import Link from "next/link";
import { Gauge, Fuel as FuelIcon, Settings2, MapPin, Phone, Clock, Search } from "lucide-react";
import { PhotoGallery } from "@/templates/shared/gallery";
import type {
  ContactProps,
  HomeProps,
  ListingProps,
  SiteLinks,
  StockFacets,
  TemplateModule,
  VehicleDetailProps,
  VehicleView,
} from "@/templates/contract";
import { BODY_TYPE_LABELS, FUEL_LABELS, TRANSMISSION_LABELS } from "@/lib/catalog/labels";
import type { SiteData } from "@/templates/contract";

/* ------------------------------------------------------------------ */
/* Estrutura                                                           */
/* ------------------------------------------------------------------ */

const WEEKDAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

function Header({ site, links }: { site: SiteData; links: SiteLinks }) {
  return (
    <header className="sticky top-0 z-30 border-b border-black/5 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href={links.home} className="flex items-center gap-2.5">
          {site.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={site.logoUrl} alt={site.name} className="h-9 w-auto object-contain" />
          ) : (
            <span
              className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold"
              style={{
                backgroundColor: "var(--site-primary)",
                color: "var(--site-primary-foreground)",
              }}
            >
              {site.name.charAt(0)}
            </span>
          )}
          <span
            className="text-base font-semibold text-slate-900"
            style={{ fontFamily: "var(--site-font-heading)" }}
          >
            {site.name}
          </span>
        </Link>

        <nav className="flex items-center gap-1 text-sm">
          <Link href={links.stock} className="rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100">
            Estoque
          </Link>
          <Link href={links.contact} className="rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100">
            Contato
          </Link>
          {site.contact.whatsappDigits ? (
            <a
              href={links.whatsapp(`Olá! Vim pelo site da ${site.name}.`) ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-1 rounded-lg px-4 py-2 text-sm font-medium"
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
    <footer className="mt-16 border-t border-black/5 bg-slate-50">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3">
        <div>
          <p
            className="text-base font-semibold text-slate-900"
            style={{ fontFamily: "var(--site-font-heading)" }}
          >
            {site.name}
          </p>
          {site.contact.address.full ? (
            <p className="mt-2 flex items-start gap-2 text-sm text-slate-500">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
              {site.contact.address.full}
            </p>
          ) : null}
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-slate-900">Contato</p>
          <ul className="space-y-1.5 text-sm text-slate-500">
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
                  className="hover:underline"
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
              <p className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-900">
                <Clock className="h-4 w-4" />
                Horários
              </p>
              <ul className="space-y-1 text-sm text-slate-500">
                {site.contact.businessHours.map((hour) => (
                  <li key={hour.weekday}>
                    {WEEKDAYS[hour.weekday]}:{" "}
                    {hour.open && hour.close ? `${hour.open} às ${hour.close}` : "Fechado"}
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </div>
      </div>

      <div className="border-t border-black/5 px-4 py-4 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} {site.name}. Todos os direitos reservados.
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
      className="min-h-screen bg-white text-slate-900"
      style={{ fontFamily: "var(--site-font-body)" }}
    >
      <Header site={site} links={links} />
      <main>{children}</main>
      <Footer site={site} links={links} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Peças reutilizadas                                                  */
/* ------------------------------------------------------------------ */

function VehicleCard({ vehicle, links }: { vehicle: VehicleView; links: SiteLinks }) {
  return (
    <Link
      href={links.vehicle(vehicle.slug)}
      className="group overflow-hidden rounded-xl border border-black/5 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative aspect-4/3 overflow-hidden bg-slate-100">
        {vehicle.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={vehicle.coverUrl}
            alt={vehicle.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            Sem foto
          </div>
        )}
        {vehicle.status === "reserved" ? (
          <span className="absolute left-3 top-3 rounded-full bg-amber-500 px-2.5 py-1 text-xs font-medium text-white">
            Reservado
          </span>
        ) : null}
      </div>

      <div className="p-4">
        <h3
          className="line-clamp-1 text-base font-semibold text-slate-900"
          style={{ fontFamily: "var(--site-font-heading)" }}
        >
          {vehicle.brand} {vehicle.model}
        </h3>
        {vehicle.version ? (
          <p className="line-clamp-1 text-sm text-slate-500">{vehicle.version}</p>
        ) : null}

        <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
          <span>{vehicle.yearLabel}</span>
          <span className="h-1 w-1 rounded-full bg-slate-300" />
          <span>{vehicle.mileageLabel}</span>
        </div>

        <p
          className="mt-3 text-lg font-bold"
          style={{ color: "var(--site-primary)", fontFamily: "var(--site-font-heading)" }}
        >
          {vehicle.priceLabel}
        </p>
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
  const inputClass =
    "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-[var(--site-primary)] focus:outline-none";

  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div className="lg:col-span-2">
        <label className="mb-1 block text-xs font-medium text-slate-500" htmlFor="q">
          Buscar
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            id="q"
            name="q"
            defaultValue={filters.search ?? ""}
            placeholder="Marca, modelo ou versão"
            className={`${inputClass} pl-9`}
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500" htmlFor="marca">
          Marca
        </label>
        <select id="marca" name="marca" defaultValue={filters.brand ?? ""} className={inputClass}>
          <option value="">Todas</option>
          {facets.brands.map((item) => (
            <option key={item.brand} value={item.brand}>
              {item.brand}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500" htmlFor="cambio">
          Câmbio
        </label>
        <select
          id="cambio"
          name="cambio"
          defaultValue={filters.transmission ?? ""}
          className={inputClass}
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
        <label className="mb-1 block text-xs font-medium text-slate-500" htmlFor="combustivel">
          Combustível
        </label>
        <select
          id="combustivel"
          name="combustivel"
          defaultValue={filters.fuel ?? ""}
          className={inputClass}
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
        <label className="mb-1 block text-xs font-medium text-slate-500" htmlFor="carroceria">
          Carroceria
        </label>
        <select
          id="carroceria"
          name="carroceria"
          defaultValue={filters.bodyType ?? ""}
          className={inputClass}
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
          <label className="mb-1 block text-xs font-medium text-slate-500" htmlFor="precoMin">
            Preço mín.
          </label>
          <input
            id="precoMin"
            name="precoMin"
            inputMode="numeric"
            defaultValue={filters.priceMin ? filters.priceMin / 100 : ""}
            placeholder="0"
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500" htmlFor="precoMax">
            Preço máx.
          </label>
          <input
            id="precoMax"
            name="precoMax"
            inputMode="numeric"
            defaultValue={filters.priceMax ? filters.priceMax / 100 : ""}
            placeholder="200000"
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500" htmlFor="anoMin">
            Ano mín.
          </label>
          <input
            id="anoMin"
            name="anoMin"
            inputMode="numeric"
            defaultValue={filters.yearMin ?? ""}
            placeholder={String(facets.yearRange.min || "")}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500" htmlFor="kmMax">
            KM máx.
          </label>
          <input
            id="kmMax"
            name="kmMax"
            inputMode="numeric"
            defaultValue={filters.kmMax ?? ""}
            placeholder="100000"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500" htmlFor="ordem">
          Ordenar por
        </label>
        <select id="ordem" name="ordem" defaultValue={filters.sort} className={inputClass}>
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
          className="h-10 w-full rounded-lg text-sm font-medium"
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
      <section className="relative overflow-hidden border-b border-black/5 bg-slate-50">
        {banner?.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={banner.imageUrl}
            alt={banner.title ?? ""}
            className="absolute inset-0 h-full w-full object-cover opacity-25"
          />
        ) : null}

        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:py-20">
          <h1
            className="max-w-2xl text-3xl font-bold leading-tight text-slate-900 sm:text-4xl"
            style={{ fontFamily: "var(--site-font-heading)" }}
          >
            {banner?.title ?? `Seminovos selecionados na ${site.name}`}
          </h1>
          <p className="mt-3 max-w-xl text-base text-slate-600">
            {banner?.subtitle ??
              `${totalVehicles} veículo(s) disponíveis, com procedência e documentação em dia.`}
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href={banner?.ctaHref ?? links.stock}
              className="rounded-lg px-5 py-3 text-sm font-medium"
              style={{
                backgroundColor: "var(--site-primary)",
                color: "var(--site-primary-foreground)",
              }}
            >
              {banner?.ctaLabel ?? "Ver estoque completo"}
            </Link>
            {site.contact.whatsappDigits ? (
              <a
                href={links.whatsapp(`Olá! Gostaria de falar com a ${site.name}.`) ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-800 hover:bg-slate-50"
              >
                Falar no WhatsApp
              </a>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <h2
            className="mb-4 text-lg font-semibold text-slate-900"
            style={{ fontFamily: "var(--site-font-heading)" }}
          >
            Encontre seu carro
          </h2>
          <FilterForm facets={facets} filters={{ sort: "recentes" }} action={links.stock} />
        </div>
      </section>

      {featured.length > 0 ? (
        <section className="mx-auto max-w-6xl px-4 pb-12">
          <div className="mb-5 flex items-end justify-between">
            <h2
              className="text-xl font-bold text-slate-900"
              style={{ fontFamily: "var(--site-font-heading)" }}
            >
              Destaques
            </h2>
            <Link href={links.stock} className="text-sm font-medium hover:underline" style={{ color: "var(--site-primary)" }}>
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
        <section className="mx-auto max-w-6xl px-4 pb-12">
          <h2
            className="mb-5 text-xl font-bold text-slate-900"
            style={{ fontFamily: "var(--site-font-heading)" }}
          >
            Chegaram recentemente
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {latest.map((vehicle) => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} links={links} />
            ))}
          </div>
        </section>
      ) : null}

      {site.aboutText ? (
        <section className="border-t border-black/5 bg-slate-50">
          <div className="mx-auto max-w-3xl px-4 py-12 text-center">
            <h2
              className="text-xl font-bold text-slate-900"
              style={{ fontFamily: "var(--site-font-heading)" }}
            >
              {site.aboutTitle ?? "Sobre nós"}
            </h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-600">
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
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1
          className="text-2xl font-bold text-slate-900"
          style={{ fontFamily: "var(--site-font-heading)" }}
        >
          Estoque
        </h1>
        <p className="mt-1 text-sm text-slate-500">{total} veículo(s) encontrados</p>

        <div className="my-6 rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <FilterForm facets={facets} filters={filters} action={links.stock} />
        </div>

        {vehicles.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 px-6 py-16 text-center">
            <p className="text-base font-medium text-slate-700">Nenhum veículo encontrado</p>
            <p className="mt-1 text-sm text-slate-500">
              Tente ajustar os filtros ou fale com a gente pelo WhatsApp.
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
          <div className="mt-8 flex items-center justify-center gap-4 text-sm">
            {page > 1 ? (
              <Link href={pageHref(page - 1)} className="font-medium hover:underline" style={{ color: "var(--site-primary)" }}>
                Anterior
              </Link>
            ) : null}
            <span className="text-slate-500">
              Página {page} de {totalPages}
            </span>
            {page < totalPages ? (
              <Link href={pageHref(page + 1)} className="font-medium hover:underline" style={{ color: "var(--site-primary)" }}>
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
    { icon: <Gauge className="h-4 w-4" />, label: "Quilometragem", value: vehicle.mileageLabel },
    { icon: <Settings2 className="h-4 w-4" />, label: "Câmbio", value: vehicle.transmissionLabel },
    { icon: <FuelIcon className="h-4 w-4" />, label: "Combustível", value: vehicle.fuelLabel },
    { label: "Ano", value: vehicle.yearLabel },
    { label: "Carroceria", value: vehicle.bodyTypeLabel },
    { label: "Cor", value: vehicle.color },
    { label: "Portas", value: vehicle.doors ? `${vehicle.doors} portas` : null },
    { label: "Final da placa", value: vehicle.licensePlateEnd },
  ].filter((spec) => Boolean(spec.value));

  const optionGroups = Array.from(new Set(vehicle.options.map((option) => option.group)));

  return (
    <Shell site={site} links={links}>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <nav className="mb-4 text-sm text-slate-500">
          <Link href={links.home} className="hover:underline">
            Início
          </Link>
          <span className="mx-2">/</span>
          <Link href={links.stock} className="hover:underline">
            Estoque
          </Link>
          <span className="mx-2">/</span>
          <span className="text-slate-700">{vehicle.title}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
          <div>
            <PhotoGallery photos={vehicle.photos} title={vehicle.title} tone="light" />

            <div className="mt-8">
              <h2
                className="mb-3 text-lg font-semibold text-slate-900"
                style={{ fontFamily: "var(--site-font-heading)" }}
              >
                Ficha técnica
              </h2>
              <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                {specs.map((spec) => (
                  <div
                    key={spec.label}
                    className="flex items-center justify-between border-b border-slate-100 pb-2"
                  >
                    <dt className="flex items-center gap-2 text-sm text-slate-500">
                      {spec.icon}
                      {spec.label}
                    </dt>
                    <dd className="text-sm font-medium text-slate-900">{spec.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {vehicle.options.length > 0 ? (
              <div className="mt-8">
                <h2
                  className="mb-3 text-lg font-semibold text-slate-900"
                  style={{ fontFamily: "var(--site-font-heading)" }}
                >
                  Opcionais
                </h2>
                {optionGroups.map((group) => (
                  <div key={group} className="mb-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      {group}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {vehicle.options
                        .filter((option) => option.group === group)
                        .map((option) => (
                          <span
                            key={option.key}
                            className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700"
                          >
                            {option.label}
                          </span>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {vehicle.description ? (
              <div className="mt-8">
                <h2
                  className="mb-3 text-lg font-semibold text-slate-900"
                  style={{ fontFamily: "var(--site-font-heading)" }}
                >
                  Sobre este veículo
                </h2>
                <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">
                  {vehicle.description}
                </p>
              </div>
            ) : null}
          </div>

          <aside className="lg:sticky lg:top-20 lg:self-start">
            <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
              <h1
                className="text-xl font-bold text-slate-900"
                style={{ fontFamily: "var(--site-font-heading)" }}
              >
                {vehicle.brand} {vehicle.model}
              </h1>
              {vehicle.version ? (
                <p className="mt-0.5 text-sm text-slate-500">{vehicle.version}</p>
              ) : null}

              <p
                className="mt-4 text-3xl font-bold"
                style={{ color: "var(--site-primary)", fontFamily: "var(--site-font-heading)" }}
              >
                {vehicle.priceLabel}
              </p>

              <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                <span className="rounded-full bg-slate-100 px-2.5 py-1">{vehicle.yearLabel}</span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1">{vehicle.mileageLabel}</span>
                {vehicle.transmissionLabel ? (
                  <span className="rounded-full bg-slate-100 px-2.5 py-1">
                    {vehicle.transmissionLabel}
                  </span>
                ) : null}
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
                  className="mt-5 block rounded-lg py-3 text-center text-sm font-medium"
                  style={{
                    backgroundColor: "var(--site-primary)",
                    color: "var(--site-primary-foreground)",
                  }}
                >
                  Falar no WhatsApp
                </a>
              ) : null}

              <div className="mt-5 border-t border-slate-100 pt-5">{leadForm}</div>
            </div>
          </aside>
        </div>

        {related.length > 0 ? (
          <section className="mt-14">
            <h2
              className="mb-5 text-xl font-bold text-slate-900"
              style={{ fontFamily: "var(--site-font-heading)" }}
            >
              Veículos parecidos
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
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1
          className="text-2xl font-bold text-slate-900"
          style={{ fontFamily: "var(--site-font-heading)" }}
        >
          Fale com a {site.name}
        </h1>

        {site.aboutText ? (
          <div className="mt-6 rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900">
              {site.aboutTitle ?? "Sobre nós"}
            </h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-600">
              {site.aboutText}
            </p>
          </div>
        ) : null}

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
            <h2 className="mb-3 text-base font-semibold text-slate-900">Contato</h2>
            <ul className="space-y-2 text-sm text-slate-600">
              {site.contact.phone ? <li>Telefone: {site.contact.phone}</li> : null}
              {site.contact.whatsapp ? <li>WhatsApp: {site.contact.whatsapp}</li> : null}
              {site.contact.email ? <li>E-mail: {site.contact.email}</li> : null}
            </ul>
            {site.contact.whatsappDigits ? (
              <a
                href={links.whatsapp(`Olá! Vim pelo site da ${site.name}.`) ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block rounded-lg px-4 py-2.5 text-sm font-medium"
                style={{
                  backgroundColor: "var(--site-primary)",
                  color: "var(--site-primary-foreground)",
                }}
              >
                Chamar no WhatsApp
              </a>
            ) : null}
          </div>

          <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
            <h2 className="mb-3 text-base font-semibold text-slate-900">Onde estamos</h2>
            {site.contact.address.full ? (
              <p className="text-sm text-slate-600">{site.contact.address.full}</p>
            ) : (
              <p className="text-sm text-slate-500">Endereço não informado.</p>
            )}
            {site.contact.mapsUrl ? (
              <a
                href={site.contact.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block text-sm font-medium hover:underline"
                style={{ color: "var(--site-primary)" }}
              >
                Ver no mapa
              </a>
            ) : null}

            {site.contact.businessHours.length > 0 ? (
              <>
                <h3 className="mb-2 mt-5 text-sm font-semibold text-slate-900">Horários</h3>
                <ul className="space-y-1 text-sm text-slate-600">
                  {site.contact.businessHours.map((hour) => (
                    <li key={hour.weekday}>
                      {WEEKDAYS[hour.weekday]}:{" "}
                      {hour.open && hour.close ? `${hour.open} às ${hour.close}` : "Fechado"}
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </Shell>
  );
}

const template: TemplateModule = { Home, Listing, VehicleDetail, Contact };
export default template;
