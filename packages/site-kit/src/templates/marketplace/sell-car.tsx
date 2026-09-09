import type { SellCarProps } from "../contract";
import { HelpBand, SHELL, SectionHeading, Shell } from "./chrome";

const PASSOS = [
  { numero: "01", title: "Conte sobre o carro", text: "Marca, modelo, ano e quilometragem." },
  { numero: "02", title: "Fale com a loja", text: "A equipe valida os dados com você." },
  { numero: "03", title: "Faça a vistoria", text: "Avaliação presencial quando necessário." },
  { numero: "04", title: "Receba a proposta", text: "As condições na mesa, e você decide." },
];

const AJUDA = [
  "Quilometragem atual, sem arredondar",
  "Fotos recentes do carro",
  "Versão e opcionais",
  "Histórico de manutenção",
  "Estado geral de pintura e pneus",
  "Situação da documentação",
];

export function SellCar({ site, links, sellForm }: SellCarProps) {
  return (
    <Shell site={site} links={links}>
      <section className="bg-[var(--site-background)] py-12">
        <div
          className={`${SHELL} grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,1fr)_500px]`}
        >
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--site-primary)]">
              Venda seu carro
            </p>
            <h1
              className="mt-3 max-w-[16ch] text-[36px] font-bold leading-[1.1]"
              style={{ fontFamily: "var(--site-font-heading)" }}
            >
              Use seu carro na negociação.
            </h1>
            <p className="mt-4 max-w-[50ch] text-[14px] leading-relaxed text-[var(--site-muted)]">
              Conte pra gente qual é o seu carro. A equipe avalia os dados, entra em contato e
              apresenta uma proposta sem compromisso.
            </p>

            <ul className="mt-7 grid gap-2">
              {AJUDA.map((item) => (
                <li
                  key={item}
                  className="rounded-[var(--site-radius)] border border-[var(--site-border)] px-4 py-2.5 text-[13px]"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-[var(--site-radius)] border border-[var(--site-border)] bg-[var(--site-surface)] p-6">
            <p className="text-[16px] font-semibold" style={{ fontFamily: "var(--site-font-heading)" }}>
              Comece sua avaliação
            </p>
            <p className="mt-1 text-[12px] leading-relaxed text-[var(--site-muted)]">
              Preencha os dados principais. A loja entra em contato para continuar.
            </p>
            <div className="mt-5">{sellForm}</div>
          </div>
        </div>
      </section>

      <section className={`${SHELL} py-12`}>
        <SectionHeading title="Como funciona" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PASSOS.map((passo) => (
            <div
              key={passo.numero}
              className="rounded-[var(--site-radius)] border border-[var(--site-border)] p-5"
            >
              <p
                className="text-[15px] font-bold text-[var(--site-primary)]"
                style={{ fontFamily: "var(--site-font-heading)" }}
              >
                {passo.numero}
              </p>
              <p className="mt-2 text-[13px] font-medium">{passo.title}</p>
              <p className="mt-1 text-[12px] leading-relaxed text-[var(--site-muted)]">
                {passo.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      <HelpBand
        site={site}
        links={links}
        title="Quer falar antes de preencher?"
        description="A equipe orienta sobre os dados necessários e combina a melhor forma de avaliação."
      />
    </Shell>
  );
}
