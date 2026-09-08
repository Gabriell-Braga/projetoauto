import Link from "next/link";
import { MessageCircle } from "lucide-react";
import type { SiteLinks, VehicleView } from "@/templates/contract";

/**
 * Card de veículo do template Vitrine.
 *
 * Duas ações explícitas, não um card inteiro clicável: o desenho pede "Ver
 * detalhes" e "Falar no WhatsApp" lado a lado, e são intenções diferentes —
 * quem já decidiu quer o WhatsApp, quem está comparando quer a ficha. Um card
 * clicável inteiro roubaria o clique do WhatsApp para a ficha.
 */
export function VehicleCard({
  vehicle,
  links,
  storeName,
}: {
  vehicle: VehicleView;
  links: SiteLinks;
  storeName: string;
}) {
  const whatsapp = links.whatsapp(
    `Olá! Tenho interesse no ${vehicle.title} ${vehicle.yearLabel} anunciado no site da ${storeName}.`,
  );

  return (
    <article className="flex flex-col overflow-hidden rounded-[var(--site-radius)] border border-[var(--site-border)] bg-[var(--site-surface)]">
      <Link href={links.vehicle(vehicle.slug)} className="group relative block">
        <div className="relative aspect-4/3 overflow-hidden bg-[var(--site-background)]">
          {vehicle.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={vehicle.coverUrl}
              alt={vehicle.title}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-[var(--site-muted)]">
              Sem foto
            </div>
          )}
        </div>

        <Badge vehicle={vehicle} />
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <h3
          className="line-clamp-2 text-[17px] font-semibold leading-snug text-[var(--site-text)]"
          style={{ fontFamily: "var(--site-font-heading)" }}
        >
          <Link href={links.vehicle(vehicle.slug)}>{vehicle.title}</Link>
        </h3>

        {/* ano · km · câmbio, na ordem que a pessoa compara */}
        <p className="mt-1.5 text-[13px] text-[var(--site-muted)]">
          {[vehicle.yearLabel, vehicle.mileageLabel, vehicle.transmissionLabel]
            .filter(Boolean)
            .join(" • ")}
        </p>

        <p
          className="mt-3 text-[22px] font-bold leading-none text-[var(--site-text)]"
          style={{ fontFamily: "var(--site-font-heading)" }}
        >
          {vehicle.priceLabel}
        </p>

        {/*
          "Financiamento disponível" só aparece com preço.
          Em veículo sob consulta não há valor para financiar, e a frase
          prometeria uma conta que a página seguinte não consegue fazer.
        */}
        {!vehicle.priceOnRequest ? (
          <p className="mt-1.5 text-xs font-medium text-[var(--site-success)]">
            Financiamento disponível
          </p>
        ) : null}

        <div className="mt-4 flex flex-col gap-2">
          <Link
            href={links.vehicle(vehicle.slug)}
            className="inline-flex items-center justify-center rounded-lg bg-[var(--site-primary)] px-4 py-2.5 text-sm font-medium text-[var(--site-primary-foreground)] transition-colors hover:bg-[var(--site-primary-hover)]"
          >
            Ver detalhes
          </Link>

          {whatsapp ? (
            <a
              href={whatsapp}
              target="_blank"
              rel="noreferrer"
              style={{ backgroundColor: "var(--site-whatsapp)" }}
              className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              Falar no WhatsApp
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}

/**
 * Selo do card. Reservado vence destaque.
 *
 * Um carro reservado marcado como "Destaque" convida ao clique e termina em
 * decepção; a informação que muda a decisão é a de que ele já tem dono.
 */
function Badge({ vehicle }: { vehicle: VehicleView }) {
  const badge =
    vehicle.status === "reserved"
      ? { label: "Reservado", className: "bg-[var(--site-text)] text-white" }
      : vehicle.featured
        ? { label: "Destaque", className: "bg-[var(--site-surface)] text-[var(--site-text)]" }
        : null;

  if (!badge) return null;

  return (
    <span
      className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-medium shadow-sm ${badge.className}`}
    >
      {badge.label}
    </span>
  );
}

/** Grade padrão de cards — três colunas no desktop, como o desenho. */
export function VehicleGrid({
  vehicles,
  links,
  storeName,
  columns = 3,
}: {
  vehicles: VehicleView[];
  links: SiteLinks;
  storeName: string;
  columns?: 3 | 4;
}) {
  return (
    <div
      className={`grid gap-5 sm:grid-cols-2 ${columns === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}
    >
      {vehicles.map((vehicle) => (
        <VehicleCard key={vehicle.id} vehicle={vehicle} links={links} storeName={storeName} />
      ))}
    </div>
  );
}
