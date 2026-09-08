import Link from "next/link";
import { Star } from "lucide-react";
import type { AboutProps, SiteReview } from "../contract";
import { summarizeHours } from "../shared/hours";
import {
  CheckList,
  SHELL,
  SectionHeading,
  Shell,
  StepCards,
  WhatsappBand,
} from "./chrome";

const DIFERENCIAIS = [
  "Estoque atualizado e informações objetivas",
  "Atendimento direto com a equipe da loja",
  "Financiamento, troca e avaliação do usado",
  "Processo transparente do interesse à negociação",
];

const PILARES = [
  {
    title: "Estoque atualizado",
    text: "Veículos com informações essenciais, preço, condições e contato direto.",
  },
  {
    title: "Atendimento humano",
    text: "Você fala com a equipe da própria loja para tirar dúvidas e avançar na negociação.",
  },
  {
    title: "Compra, troca e financiamento",
    text: "A jornada pode reunir veículo, avaliação do seu usado e opções de financiamento.",
  },
];

const JORNADA = [
  { title: "Encontre o veículo", text: "Pesquise o estoque, compare opções e veja os detalhes." },
  { title: "Fale com a loja", text: "Use o WhatsApp ou formulário para demonstrar interesse." },
  {
    title: "Avalie as condições",
    text: "Converse sobre financiamento, troca e disponibilidade.",
  },
  {
    title: "Avance na negociação",
    text: "Agende visita, avaliação ou próximos passos com a equipe.",
  },
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
    <div className="rounded-[var(--site-radius)] bg-[var(--site-primary)]/[0.06] px-5 py-4">
      <Stars rating={review.rating} />
      <p className="mt-2 text-[13px] leading-relaxed text-[var(--site-text)]">“{review.text}”</p>
      {review.author ? (
        <p className="mt-2 text-xs text-[var(--site-muted)]">{review.author}</p>
      ) : null}
    </div>
  );
}

export function About({ site, links, totalVehicles }: AboutProps) {
  const hours = summarizeHours(site.contact.businessHours);
  const foto = site.banners[0]?.imageUrl ?? null;

  return (
    <Shell site={site} links={links} active="about">
      {/* ----------------------------------------------------------- herói */}
      <section className="border-b border-[var(--site-border)] bg-[var(--site-background)]">
        <div className={`${SHELL} grid grid-cols-1 items-start gap-10 py-14 lg:grid-cols-[minmax(0,1fr)_460px]`}>
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--site-primary)]">
              Sobre nós
            </p>
            <h1
              className="max-w-lg text-[34px] font-bold leading-tight text-[var(--site-text)] sm:text-[40px]"
              style={{ fontFamily: "var(--site-font-heading)" }}
            >
              {site.aboutTitle ?? "Uma loja feita para facilitar a compra e a venda do seu carro"}
            </h1>
            <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-[var(--site-muted)]">
              {site.aboutText ??
                `A ${site.name} reúne estoque, atendimento e negociação em um só lugar. Nosso objetivo é ajudar você a encontrar o veículo certo ou vender o seu com um processo claro e atendimento direto.`}
            </p>
            <CheckList items={DIFERENCIAIS} className="mt-6" />
          </div>

          {/* contorno: sem ele o espaço reservado some no fundo da seção */}
          <div className="aspect-4/3 overflow-hidden rounded-[var(--site-radius)] border border-[var(--site-border)] bg-[var(--site-surface)]">
            {foto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={foto} alt={site.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-1 text-sm text-[var(--site-muted)]">
                <span>Foto da loja / equipe</span>
                <span className="text-xs">Imagem configurável da revenda</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ------------------------------------------- nossa forma de trabalhar */}
      <section className={`${SHELL} py-14`}>
        <SectionHeading
          title="Nossa forma de trabalhar"
          description="Confiança vem de informação clara, atendimento acessível e um processo simples."
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {PILARES.map((pilar) => (
            <div
              key={pilar.title}
              className="rounded-[var(--site-radius)] border border-[var(--site-border)] bg-[var(--site-surface)] p-6"
            >
              <h3
                className="text-base font-semibold text-[var(--site-text)]"
                style={{ fontFamily: "var(--site-font-heading)" }}
              >
                {pilar.title}
              </h3>
              <p className="mt-2 text-[13px] leading-relaxed text-[var(--site-muted)]">
                {pilar.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* -------------------------------------------- da busca à negociação */}
      <section className="border-y border-[var(--site-border)] bg-[var(--site-background)] py-14">
        <div className={SHELL}>
          <SectionHeading
            title="Da busca à negociação"
            description="A experiência da loja foi pensada para reduzir etapas e deixar claro o que acontece em cada momento."
          />
          <StepCards steps={JORNADA} />
        </div>
      </section>

      {/* --------------------------------- estrutura + o que os clientes dizem */}
      <section className={`${SHELL} py-14`}>
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
          <div>
            <h2
              className="text-[26px] font-bold leading-tight text-[var(--site-text)]"
              style={{ fontFamily: "var(--site-font-heading)" }}
            >
              Atendimento e estrutura
            </h2>
            <p className="mt-2 max-w-md text-[14px] leading-relaxed text-[var(--site-muted)]">
              A experiência não termina no site. A revenda pode apresentar aqui sua loja física,
              equipe, horários e diferenciais de atendimento.
            </p>

            <div className="mt-5 aspect-16/9 overflow-hidden rounded-[var(--site-radius)] border border-[var(--site-border)] bg-[var(--site-background)]">
              {site.banners[1]?.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={site.banners[1].imageUrl}
                  alt={site.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-[var(--site-muted)]">
                  Foto da estrutura
                </div>
              )}
            </div>

            {site.contact.address.full ? (
              <p className="mt-4 text-sm font-medium text-[var(--site-text)]">
                {site.contact.address.full}
              </p>
            ) : null}
            {hours.length > 0 ? (
              <p className="mt-1 text-[13px] text-[var(--site-muted)]">
                {hours
                  .filter((line) => line.value !== "Fechado")
                  .map((line) => `${line.label}: ${line.value}`)
                  .join(" • ")}
              </p>
            ) : null}
          </div>

          {/*
            A seção de depoimentos some quando não há nenhum.
            O desenho reserva o espaço, mas um bloco vazio dizendo "avaliações"
            numa loja sem avaliação nenhuma trabalha contra ela.
          */}
          {site.reviews.length > 0 ? (
            <div id="avaliacoes" className="scroll-mt-24">
              <h2
                className="text-[26px] font-bold leading-tight text-[var(--site-text)]"
                style={{ fontFamily: "var(--site-font-heading)" }}
              >
                O que os clientes dizem
              </h2>
              <p className="mt-2 text-[14px] leading-relaxed text-[var(--site-muted)]">
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

      <WhatsappBand
        site={site}
        links={links}
        title="Pronto para encontrar seu próximo carro?"
        description="Veja os veículos disponíveis ou converse diretamente com nossa equipe pelo WhatsApp."
        extra={
          <Link
            href={links.stock}
            className="inline-flex items-center justify-center rounded-full bg-[var(--site-primary)] px-5 py-2.5 text-sm font-medium text-[var(--site-primary-foreground)] transition-colors hover:bg-[var(--site-primary-hover)]"
          >
            Ver estoque{totalVehicles > 0 ? ` (${totalVehicles})` : ""}
          </Link>
        }
      />
    </Shell>
  );
}
