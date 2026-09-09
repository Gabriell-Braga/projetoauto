import type { SellCarProps } from "../contract";
import { RuledRow, SHELL, SectionHeading, Shell, TalkBand } from "./chrome";

const PASSOS = [
  { title: "Conte sobre o carro", text: "Marca, modelo, ano e quilometragem atual." },
  { title: "Fale com a loja", text: "A equipe entra em contato para validar os dados." },
  { title: "Faça a vistoria", text: "Agende a avaliação presencial quando necessário." },
  { title: "Receba a proposta", text: "A loja apresenta as condições e você decide." },
];

const AJUDA = [
  { title: "Quilometragem atual", text: "O número do painel, sem arredondar." },
  { title: "Fotos recentes", text: "Frente, traseira, laterais e interior." },
  { title: "Versão e opcionais", text: "O que o carro tem além do básico." },
  { title: "Histórico de manutenção", text: "Revisões feitas e o que foi trocado." },
  { title: "Estado geral", text: "Pintura, pneus e o que precisa de atenção." },
  { title: "Documentação", text: "Situação do documento e de débitos." },
];

export function SellCar({ site, links, sellForm }: SellCarProps) {
  return (
    <Shell site={site} links={links}>
      <section className="bg-[var(--site-background)] py-14">
        <div
          className={`${SHELL} grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,1fr)_500px]`}
        >
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--site-primary)]">
              Venda seu carro
            </p>
            <h1
              className="mt-3 max-w-[16ch] text-[40px] leading-[1.1]"
              style={{ fontFamily: "var(--site-font-heading)" }}
            >
              Venda seu carro de forma simples e segura.
            </h1>
            <p className="mt-4 max-w-[52ch] text-[14px] leading-relaxed text-[var(--site-muted)]">
              Conte pra gente qual é o seu carro. Nossa equipe avalia os dados, entra em contato e
              apresenta uma proposta sem compromisso.
            </p>
          </div>

          <div className="rounded-[var(--site-radius)] bg-[var(--site-surface)] p-6">
            <p className="text-[17px]" style={{ fontFamily: "var(--site-font-heading)" }}>
              Comece sua avaliação
            </p>
            <p className="mt-1 text-[12px] leading-relaxed text-[var(--site-muted)]">
              Preencha os dados principais do veículo. A loja entra em contato para continuar.
            </p>
            <div className="mt-5">{sellForm}</div>
          </div>
        </div>
      </section>

      <section className={`${SHELL} py-14`}>
        <SectionHeading
          title="Como funciona"
          description="Da primeira informação até a proposta, sem complicação."
        />
        <RuledRow items={PASSOS} columns={4} />
      </section>

      <section className="bg-[var(--site-background)] py-14">
        <div className={SHELL}>
          <SectionHeading
            title="O que ajuda na avaliação"
            description="Quanto mais informação você enviar, mais rápida tende a ser a análise inicial."
          />
          <RuledRow items={AJUDA} />
        </div>
      </section>

      <TalkBand
        site={site}
        links={links}
        title="Quer falar com alguém antes de preencher?"
        description="A equipe orienta sobre os dados necessários e combina a melhor forma de avaliação."
      />
    </Shell>
  );
}
