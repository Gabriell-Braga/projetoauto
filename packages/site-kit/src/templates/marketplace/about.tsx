import Link from "next/link";
import { Star } from "lucide-react";
import type { AboutProps, SiteReview } from "../contract";
import { summarizeHours } from "../shared/hours";
import { HelpBand, SHELL, SectionHeading, Shell } from "./chrome";

const PILARES = [
  { numero: "01", title: "Estoque atualizado", text: "Anúncios revisados e informação em dia." },
  { numero: "02", title: "Condições transparentes", text: "O que muda o preço aparece antes." },
  { numero: "03", title: "Atendimento humano", text: "Você fala com a equipe da própria loja." },
  { numero: "04", title: "Troca e financiamento", text: "A negociação cabe num só lugar." },
];

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} de 5 estrelas`}>
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          aria-hidden="true"
          className={
            index < rating
              ? "h-3.5 w-3.5 fill-[var(--site-primary)] text-[var(--site-primary)]"
              : "h-3.5 w-3.5 text-[var(--site-border)]"
          }
        />
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: SiteReview }) {
  return (
    <div className="rounded-[var(--site-radius)] border border-[var(--site-border)] p-5">
      <Stars rating={review.rating} />
      <p className="mt-3 text-[13px] leading-relaxed">“{review.text}”</p>
      {review.author ? (
        <p className="mt-3 text-[12px] text-[var(--site-muted)]">{review.author}</p>
      ) : null}
    </div>
  );
}

export function About({ site, links, totalVehicles }: AboutProps) {
  const hours = summarizeHours(site.contact.businessHours);
  const foto = site.banners[0]?.imageUrl ?? null;

  return (
    <Shell site={site} links={links}>
      <section className="bg-[var(--site-background)] py-12">
        <div className={`${SHELL} grid grid-cols-1 items-center gap-10 lg:grid-cols-2`}>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--site-primary)]">
              Sobre nós
            </p>
            <h1
              className="mt-3 max-w-[18ch] text-[36px] font-bold leading-[1.1]"
              style={{ fontFamily: "var(--site-font-heading)" }}
            >
              {site.aboutTitle ?? "Uma loja feita para facilitar a compra e a venda do seu carro"}
            </h1>
            <p className="mt-4 max-w-[52ch] text-[14px] leading-relaxed text-[var(--site-muted)]">
              {site.aboutText ??
                `A ${site.name} reúne estoque, atendimento e negociação em um só lugar, com um processo claro do interesse ao fechamento.`}
            </p>
          </div>

          <div className="aspect-4/3 overflow-hidden rounded-[var(--site-radius)] bg-[var(--site-border)]/40">
            {foto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={foto} alt={site.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-[11px] uppercase tracking-[0.12em] text-[var(--site-muted)]">
                Foto da loja / equipe
              </div>
            )}
          </div>
        </div>
      </section>

      {site.stats.length > 0 ? (
        <section className={`${SHELL} py-10`}>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {site.stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-[var(--site-radius)] border border-[var(--site-border)] p-5"
              >
                <p
                  className="text-[30px] font-bold leading-none text-[var(--site-primary)]"
                  style={{ fontFamily: "var(--site-font-heading)" }}
                >
                  {stat.value}
                </p>
                <p className="mt-2 text-[13px] text-[var(--site-muted)]">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className={`${SHELL} pb-12`}>
        <SectionHeading title="Nossa forma de trabalhar" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PILARES.map((pilar) => (
            <div
              key={pilar.numero}
              className="rounded-[var(--site-radius)] border border-[var(--site-border)] p-5"
            >
              <p
                className="text-[15px] font-bold text-[var(--site-primary)]"
                style={{ fontFamily: "var(--site-font-heading)" }}
              >
                {pilar.numero}
              </p>
              <p className="mt-2 text-[13px] font-medium">{pilar.title}</p>
              <p className="mt-1 text-[12px] leading-relaxed text-[var(--site-muted)]">
                {pilar.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[var(--site-background)] py-12">
        <div className={`${SHELL} grid grid-cols-1 gap-10 lg:grid-cols-2`}>
          <div>
            <h2
              className="text-[24px] font-bold leading-tight"
              style={{ fontFamily: "var(--site-font-heading)" }}
            >
              Atendimento e estrutura
            </h2>
            <p className="mt-2 max-w-[46ch] text-[13px] leading-relaxed text-[var(--site-muted)]">
              A experiência não termina no site. Conheça a loja física, a equipe e os horários.
            </p>

            <div className="mt-5 aspect-16/9 overflow-hidden rounded-[var(--site-radius)] bg-[var(--site-border)]/40">
              {site.banners[1]?.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={site.banners[1].imageUrl}
                  alt={site.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-[11px] uppercase tracking-[0.12em] text-[var(--site-muted)]">
                  Foto da estrutura
                </div>
              )}
            </div>

            {site.contact.address.full ? (
              <p className="mt-4 text-[13px] font-medium">{site.contact.address.full}</p>
            ) : null}
            {hours.length > 0 ? (
              <p className="mt-1 text-[12px] text-[var(--site-muted)]">
                {hours
                  .filter((line) => line.value !== "Fechado")
                  .map((line) => `${line.label}: ${line.value}`)
                  .join(" • ")}
              </p>
            ) : null}
          </div>

          {site.reviews.length > 0 ? (
            <div id="avaliacoes" className="scroll-mt-24">
              <h2
                className="text-[24px] font-bold leading-tight"
                style={{ fontFamily: "var(--site-font-heading)" }}
              >
                O que os clientes dizem
              </h2>
              <p className="mt-2 text-[13px] text-[var(--site-muted)]">
                Avaliações cadastradas pela loja.
              </p>
              <div className="mt-5 grid gap-3">
                {site.reviews.map((review, index) => (
                  <ReviewCard key={`${review.text.slice(0, 20)}-${index}`} review={review} />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section className={`${SHELL} py-12 text-center`}>
        <h2
          className="text-[28px] font-bold leading-tight"
          style={{ fontFamily: "var(--site-font-heading)" }}
        >
          Pronto para encontrar seu próximo carro?
        </h2>
        <Link
          href={links.stock}
          className="mt-6 inline-flex rounded-[var(--site-radius)] bg-[var(--site-primary)] px-6 py-3 text-[13px] font-medium text-[var(--site-primary-foreground)] transition-colors hover:bg-[var(--site-primary-hover)]"
        >
          Ver estoque{totalVehicles > 0 ? ` (${totalVehicles})` : ""}
        </Link>
      </section>

      <HelpBand
        site={site}
        links={links}
        title="Quer falar com a equipe?"
        description="Tire dúvidas sobre estoque, troca ou financiamento pelo WhatsApp."
      />
    </Shell>
  );
}
