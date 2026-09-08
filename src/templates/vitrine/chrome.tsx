import Link from "next/link";
import { MessageCircle } from "lucide-react";
import type { SiteData, SiteLinks, StockFacets } from "@/templates/contract";
import { BODY_TYPE_LABELS } from "@/lib/catalog/labels";
import { headlineHours, summarizeHours } from "@/templates/shared/hours";

/**
 * Moldura do template Vitrine: barra de serviço, cabeçalho e rodapé.
 *
 * Nenhuma cor literal — tudo sai das CSS variables do tema. É o que permite a
 * mesma estrutura servir revendas com identidades diferentes sem tocar no
 * código, e é a razão de o contrato ter ganhado tokens de texto, borda e
 * superfície.
 */

export const SHELL = "mx-auto w-full max-w-[1200px] px-4 sm:px-6";

/** Verde do WhatsApp: fixo, porque é marca de terceiro. */
const WHATSAPP = "var(--site-whatsapp)";

export function WhatsappButton({
  href,
  children = "Falar no WhatsApp",
  className = "",
}: {
  href: string | null;
  children?: React.ReactNode;
  className?: string;
}) {
  // sem número cadastrado o botão não vira link morto: ele some
  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      style={{ backgroundColor: WHATSAPP }}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 ${className}`}
    >
      <MessageCircle className="h-4 w-4" aria-hidden="true" />
      {children}
    </a>
  );
}

export function PrimaryButton({
  href,
  children,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center rounded-full bg-[var(--site-primary)] px-5 py-2.5 text-sm font-medium text-[var(--site-primary-foreground)] transition-colors hover:bg-[var(--site-primary-hover)] ${className}`}
    >
      {children}
    </Link>
  );
}

/** Título de seção com subtítulo — repete em todas as páginas. */
export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        {eyebrow ? (
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--site-primary)]">
            {eyebrow}
          </p>
        ) : null}
        <h2
          className="text-[28px] font-bold leading-tight text-[var(--site-text)] sm:text-[32px]"
          style={{ fontFamily: "var(--site-font-heading)" }}
        >
          {title}
        </h2>
        {description ? (
          <p className="mt-2 text-[15px] leading-relaxed text-[var(--site-muted)]">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

/**
 * Atalhos de categoria, na home e no topo do estoque.
 *
 * Saem das facetas do estoque de verdade, nao de uma lista fixa: oferecer
 * "Picapes" a uma revenda que so vende hatch leva a pessoa a uma busca vazia
 * ja no primeiro clique.
 */
export function categoryShortcuts(
  facets: StockFacets,
  links: SiteLinks,
): { label: string; href: string }[] {
  const porCarroceria = facets.bodyTypes
    .filter((body): body is NonNullable<typeof body> => Boolean(body))
    .slice(0, 5)
    .map((body) => ({
      label: BODY_TYPE_LABELS[body],
      href: links.stockWith({ carroceria: body }),
    }));

  const automaticos = facets.transmissions.includes("automatico")
    ? [{ label: "Automáticos", href: links.stockWith({ cambio: "automatico" }) }]
    : [];

  return [...porCarroceria, ...automaticos];
}

/** Linha de atalhos, com a aparencia de pilula do desenho. */
export function CategoryChips({ items }: { items: { label: string; href: string }[] }) {
  if (items.length === 0) return null;

  return (
    <div className="mt-5 flex flex-wrap gap-2">
      {items.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          className="rounded-full border border-[var(--site-border)] bg-[var(--site-surface)] px-4 py-1.5 text-sm text-[var(--site-text)] transition-colors hover:border-[var(--site-primary)] hover:text-[var(--site-primary)]"
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}

function TopBar({ site }: { site: SiteData }) {
  const hours = headlineHours(site.contact.businessHours);
  const place = [site.contact.address.city, site.contact.address.state]
    .filter(Boolean)
    .join(" / ");

  // sem horário nem cidade a faixa não tem o que dizer, e uma tarja preta
  // vazia no topo é pior que a ausência dela
  if (!hours && !place) return null;

  return (
    <div className="bg-[var(--site-text)] text-white/70">
      <div className={`${SHELL} flex h-9 items-center justify-between gap-4 text-xs`}>
        <span className="truncate">
          {hours ? `Atendimento online • ${hours}` : "Atendimento online"}
        </span>
        {place ? <span className="hidden shrink-0 font-medium text-white/90 sm:block">{place}</span> : null}
      </div>
    </div>
  );
}

function Wordmark({ site, links }: { site: SiteData; links: SiteLinks }) {
  return (
    <Link href={links.home} className="flex shrink-0 items-center gap-2.5">
      {site.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={site.logoUrl} alt={site.name} className="h-9 w-auto object-contain" />
      ) : (
        <span
          className="text-lg font-bold uppercase tracking-tight text-[var(--site-text)]"
          style={{ fontFamily: "var(--site-font-heading)" }}
        >
          {site.name}
        </span>
      )}
    </Link>
  );
}

function Header({
  site,
  links,
  active,
}: {
  site: SiteData;
  links: SiteLinks;
  active?: NavKey;
}) {
  const items = navItems(links);

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--site-border)] bg-[var(--site-surface)]">
      <div className={`${SHELL} flex h-[68px] items-center justify-between gap-6`}>
        <Wordmark site={site} links={links} />

        <nav className="hidden items-center gap-7 lg:flex">
          {items.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              aria-current={active === item.key ? "page" : undefined}
              className={
                active === item.key
                  ? "text-sm font-medium text-[var(--site-primary)]"
                  : "text-sm text-[var(--site-text)] transition-colors hover:text-[var(--site-primary)]"
              }
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-4">
          {site.contact.phone ? (
            <a
              href={`tel:${site.contact.phone.replace(/\D/g, "")}`}
              className="hidden text-sm text-[var(--site-text)] transition-colors hover:text-[var(--site-primary)] md:block"
            >
              {site.contact.phone}
            </a>
          ) : null}
          <WhatsappButton href={links.whatsapp(`Olá! Vim pelo site da ${site.name}.`)} />
        </div>
      </div>

      {/* a navegação em telas pequenas rola na horizontal: menu sanfonado
          esconderia o Estoque, que é o destino de quase toda visita */}
      <nav className="flex gap-5 overflow-x-auto border-t border-[var(--site-border)] px-4 py-2.5 lg:hidden">
        {items.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className={
              active === item.key
                ? "shrink-0 text-sm font-medium text-[var(--site-primary)]"
                : "shrink-0 text-sm text-[var(--site-muted)]"
            }
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

export type NavKey = "home" | "stock" | "financing" | "sellCar" | "about" | "contact";

function navItems(links: SiteLinks): { key: NavKey; href: string; label: string }[] {
  return [
    { key: "home", href: links.home, label: "Início" },
    { key: "stock", href: links.stock, label: "Estoque" },
    { key: "financing", href: links.financing, label: "Financiamento" },
    { key: "sellCar", href: links.sellCar, label: "Venda seu carro" },
    { key: "about", href: links.about, label: "Sobre nós" },
    { key: "contact", href: links.contact, label: "Contato" },
  ];
}

function Footer({ site, links }: { site: SiteData; links: SiteLinks }) {
  const hours = site.contact.businessHours;
  const address = site.contact.address.full;

  return (
    <footer className="mt-20 bg-[var(--site-text)] text-white/70">
      <div className={`${SHELL} grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-4`}>
        <div>
          <p
            className="text-lg font-bold uppercase tracking-tight text-white"
            style={{ fontFamily: "var(--site-font-heading)" }}
          >
            {site.name}
          </p>
          {site.aboutText ? (
            <p className="mt-3 max-w-xs text-sm leading-relaxed">
              {site.aboutText.slice(0, 140)}
              {site.aboutText.length > 140 ? "…" : ""}
            </p>
          ) : null}
          {address ? <p className="mt-4 text-sm">{address}</p> : null}
          {site.contact.phone ? (
            <p className="mt-3 text-sm font-medium text-white">{site.contact.phone}</p>
          ) : null}
          {site.contact.email ? <p className="mt-1 text-sm">{site.contact.email}</p> : null}
        </div>

        <FooterColumn
          title="Estoque"
          items={[
            { label: "Todos os veículos", href: links.stock },
            { label: "SUVs", href: links.stockWith({ carroceria: "suv" }) },
            { label: "Hatches", href: links.stockWith({ carroceria: "hatch" }) },
            { label: "Sedãs", href: links.stockWith({ carroceria: "sedan" }) },
            { label: "Picapes", href: links.stockWith({ carroceria: "picape" }) },
          ]}
        />

        <FooterColumn
          title="Institucional"
          items={[
            { label: "Sobre nós", href: links.about },
            { label: "Financiamento", href: links.financing },
            { label: "Venda seu carro", href: links.sellCar },
            { label: "Contato", href: links.contact },
          ]}
        />

        <div>
          <p className="mb-4 text-sm font-semibold text-white">Atendimento</p>
          <ul className="space-y-1.5 text-sm">
            {hours.length === 0 ? <li>Consulte pelo WhatsApp</li> : null}
            {summarizeHours(hours).map((line) => (
              <li key={line.label}>
                {line.label}: {line.value}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div
          className={`${SHELL} flex flex-wrap items-center justify-between gap-3 py-5 text-xs`}
        >
          <p>
            © {new Date().getFullYear()} {site.name}. Todos os direitos reservados.
          </p>
          <div className="flex flex-wrap gap-5">
            {/* link para página que não existe é pior que link ausente: leva a
                um 404 assinado pela loja */}
            {site.legal.privacy ? (
              <Link href={links.privacy} className="transition-colors hover:text-white">
                Política de Privacidade
              </Link>
            ) : null}
            {site.legal.terms ? (
              <Link href={links.terms} className="transition-colors hover:text-white">
                Termos de Uso
              </Link>
            ) : null}
            {site.contact.social.instagram ? (
              <a
                href={site.contact.social.instagram}
                target="_blank"
                rel="noreferrer"
                className="transition-colors hover:text-white"
              >
                Instagram
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  items,
}: {
  title: string;
  items: { label: string; href: string }[];
}) {
  return (
    <div>
      <p className="mb-4 text-sm font-semibold text-white">{title}</p>
      <ul className="space-y-1.5 text-sm">
        {items.map((item) => (
          <li key={item.label}>
            <Link href={item.href} className="transition-colors hover:text-white">
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Shell({
  site,
  links,
  active,
  children,
}: {
  site: SiteData;
  links: SiteLinks;
  active?: NavKey;
  children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-screen bg-[var(--site-background)] text-[var(--site-text)]"
      style={{ fontFamily: "var(--site-font-body)" }}
    >
      <TopBar site={site} />
      <Header site={site} links={links} active={active} />
      <main>{children}</main>
      <Footer site={site} links={links} />
    </div>
  );
}

/** Faixa escura de conversão, repetida em várias páginas. */
export function WhatsappBand({
  site,
  links,
  title,
  description,
}: {
  site: SiteData;
  links: SiteLinks;
  title: string;
  description: string;
}) {
  const href = links.whatsapp(`Olá! Vim pelo site da ${site.name}.`);
  if (!href) return null;

  return (
    <section className="bg-[var(--site-text)] py-12 text-white">
      <div className={`${SHELL} flex flex-wrap items-center justify-between gap-6`}>
        <div className="max-w-xl">
          <h2
            className="text-2xl font-bold leading-tight"
            style={{ fontFamily: "var(--site-font-heading)" }}
          >
            {title}
          </h2>
          <p className="mt-2 text-sm text-white/70">{description}</p>
        </div>
        <WhatsappButton href={href} />
      </div>
    </section>
  );
}
