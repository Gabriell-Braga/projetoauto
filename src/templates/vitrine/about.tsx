import Link from "next/link";
import type { AboutProps } from "@/templates/contract";
import { summarizeHours } from "@/templates/shared/hours";
import { SHELL, SectionHeading, Shell, WhatsappButton } from "./chrome";

const PILARES = [
  {
    title: "Estoque atualizado",
    text: "Os veículos do site são os que estão no pátio, com as informações revisadas.",
  },
  {
    title: "Informação clara",
    text: "Ficha técnica, quilometragem e opcionais à vista, sem letra miúda.",
  },
  {
    title: "Atendimento direto",
    text: "Você fala com a equipe da própria loja, sem intermediários.",
  },
  {
    title: "Negociação transparente",
    text: "Financiamento e troca discutidos abertamente, no seu ritmo.",
  },
];

export function About({ site, links, totalVehicles }: AboutProps) {
  const hours = summarizeHours(site.contact.businessHours);

  return (
    <Shell site={site} links={links} active="about">
      <section className="border-b border-[var(--site-border)] bg-[var(--site-background)]">
        <div className={`${SHELL} py-14`}>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--site-primary)]">
            Sobre nós
          </p>
          <h1
            className="max-w-2xl text-[34px] font-bold leading-tight text-[var(--site-text)] sm:text-[40px]"
            style={{ fontFamily: "var(--site-font-heading)" }}
          >
            {site.aboutTitle ?? "Uma loja feita para facilitar a compra do seu carro"}
          </h1>
          {site.aboutText ? (
            <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-[var(--site-muted)]">
              {site.aboutText}
            </p>
          ) : null}

          {site.stats.length > 0 ? (
            <div className="mt-8 flex flex-wrap gap-10">
              {site.stats.map((stat) => (
                <div key={stat.label}>
                  <p
                    className="text-[30px] font-bold leading-none text-[var(--site-primary)]"
                    style={{ fontFamily: "var(--site-font-heading)" }}
                  >
                    {stat.value}
                  </p>
                  <p className="mt-1 text-[13px] text-[var(--site-muted)]">{stat.label}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section className={`${SHELL} py-14`}>
        <SectionHeading
          title="Nossa forma de trabalhar"
          description="Confiança vem de informação clara e atendimento que responde."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PILARES.map((pilar) => (
            <div
              key={pilar.title}
              className="rounded-[var(--site-radius)] border border-[var(--site-border)] bg-[var(--site-surface)] p-5"
            >
              <h3
                className="text-base font-semibold text-[var(--site-text)]"
                style={{ fontFamily: "var(--site-font-heading)" }}
              >
                {pilar.title}
              </h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--site-muted)]">
                {pilar.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-[var(--site-border)] bg-[var(--site-background)] py-14">
        <div className={`${SHELL} grid items-center gap-10 lg:grid-cols-2`}>
          {/* contorno: sem ele o espaco reservado some no fundo da secao e a
              coluna parece um vao, nao uma foto que falta */}
          <div className="aspect-4/3 overflow-hidden rounded-[var(--site-radius)] border border-[var(--site-border)] bg-[var(--site-surface)]">
            {site.banners[0]?.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={site.banners[0].imageUrl}
                alt={site.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-[var(--site-muted)]">
                Foto da estrutura
              </div>
            )}
          </div>

          <div>
            <h2
              className="text-[28px] font-bold leading-tight text-[var(--site-text)]"
              style={{ fontFamily: "var(--site-font-heading)" }}
            >
              Visite nossa loja
            </h2>
            {site.contact.address.full ? (
              <p className="mt-3 text-[15px] leading-relaxed text-[var(--site-muted)]">
                {site.contact.address.full}
              </p>
            ) : null}

            {hours.length > 0 ? (
              <ul className="mt-4 space-y-1 text-[13px] text-[var(--site-muted)]">
                {hours.map((line) => (
                  <li key={line.label}>
                    {line.label}: {line.value}
                  </li>
                ))}
              </ul>
            ) : null}

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href={links.stock}
                className="inline-flex items-center justify-center rounded-full bg-[var(--site-primary)] px-5 py-2.5 text-sm font-medium text-[var(--site-primary-foreground)] transition-colors hover:bg-[var(--site-primary-hover)]"
              >
                Ver estoque{totalVehicles > 0 ? ` (${totalVehicles})` : ""}
              </Link>
              <WhatsappButton href={links.whatsapp(`Olá! Vim pelo site da ${site.name}.`)} />
            </div>
          </div>
        </div>
      </section>
    </Shell>
  );
}
