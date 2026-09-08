import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import type { ContactProps } from "@/templates/contract";
import { summarizeHours } from "@/templates/shared/hours";
import { SHELL, SectionHeading, Shell, WhatsappBand, WhatsappButton } from "./chrome";

export function Contact({ site, links }: ContactProps) {
  const hours = summarizeHours(site.contact.businessHours);

  return (
    <Shell site={site} links={links} active="contact">
      <section className="border-b border-[var(--site-border)] bg-[var(--site-background)]">
        <div className={`${SHELL} py-14`}>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--site-primary)]">
            Contato
          </p>
          <h1
            className="text-[34px] font-bold leading-tight text-[var(--site-text)] sm:text-[40px]"
            style={{ fontFamily: "var(--site-font-heading)" }}
          >
            Fale com a nossa equipe
          </h1>
          <p className="mt-3 max-w-xl text-[15px] text-[var(--site-muted)]">
            Escolha o canal que fizer mais sentido. No horário de atendimento, o WhatsApp costuma
            ser o mais rápido.
          </p>
        </div>
      </section>

      <section className={`${SHELL} py-14`}>
        <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
          <div className="aspect-16/9 overflow-hidden rounded-[var(--site-radius)] border border-[var(--site-border)] bg-[var(--site-surface)]">
            {site.contact.mapsUrl ? (
              <a
                href={site.contact.mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="flex h-full flex-col items-center justify-center gap-2 text-sm text-[var(--site-primary)]"
              >
                <MapPin className="h-6 w-6" aria-hidden="true" />
                Ver localização no mapa
              </a>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-[var(--site-muted)]">
                Localização da loja
              </div>
            )}
          </div>

          <div className="rounded-[var(--site-radius)] border border-[var(--site-border)] bg-[var(--site-surface)] p-6">
            <p
              className="text-lg font-semibold text-[var(--site-text)]"
              style={{ fontFamily: "var(--site-font-heading)" }}
            >
              Visite nossa loja
            </p>

            {site.contact.address.full ? (
              <p className="mt-3 flex items-start gap-2 text-[13px] leading-relaxed text-[var(--site-muted)]">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                {site.contact.address.full}
              </p>
            ) : null}

            {site.contact.phone ? (
              <a
                href={`tel:${site.contact.phone.replace(/\D/g, "")}`}
                className="mt-3 flex items-center gap-2 text-sm font-medium text-[var(--site-text)] hover:text-[var(--site-primary)]"
              >
                <Phone className="h-4 w-4" aria-hidden="true" />
                {site.contact.phone}
              </a>
            ) : null}

            {site.contact.email ? (
              <a
                href={`mailto:${site.contact.email}`}
                className="mt-2 flex items-center gap-2 text-[13px] text-[var(--site-muted)] hover:text-[var(--site-primary)]"
              >
                <Mail className="h-4 w-4" aria-hidden="true" />
                {site.contact.email}
              </a>
            ) : null}

            {hours.length > 0 ? (
              <ul className="mt-4 space-y-1 border-t border-[var(--site-border)] pt-4 text-[13px] text-[var(--site-muted)]">
                {hours.map((line) => (
                  <li key={line.label}>
                    {line.label}: {line.value}
                  </li>
                ))}
              </ul>
            ) : null}

            <div className="mt-5">
              <WhatsappButton
                href={links.whatsapp(`Olá! Vim pelo site da ${site.name}.`)}
                className="w-full !rounded-lg"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--site-border)] bg-[var(--site-background)] py-14">
        <div className={SHELL}>
          <SectionHeading
            title="Como podemos ajudar?"
            description="Acesse diretamente a área mais relacionada ao que você procura."
          />
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                title: "Quero comprar um carro",
                text: "Veja o estoque disponível.",
                href: links.stock,
              },
              {
                title: "Quero financiar",
                text: "Simule entrada e prazo.",
                href: links.financing,
              },
              {
                title: "Quero vender o meu",
                text: "Receba uma avaliação.",
                href: links.sellCar,
              },
            ].map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="rounded-[var(--site-radius)] border border-[var(--site-border)] bg-[var(--site-surface)] p-5 transition-colors hover:border-[var(--site-primary)]"
              >
                <h3
                  className="text-base font-semibold text-[var(--site-text)]"
                  style={{ fontFamily: "var(--site-font-heading)" }}
                >
                  {item.title}
                </h3>
                <p className="mt-1.5 text-[13px] text-[var(--site-muted)]">{item.text}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <WhatsappBand
        site={site}
        links={links}
        title="Precisa de uma resposta rápida?"
        description="Fale direto com a equipe pelo WhatsApp durante o horário de atendimento."
      />
    </Shell>
  );
}
