import type { SellCarProps } from "../contract";
import {
  CheckList,
  CheckPills,
  SHELL,
  SectionHeading,
  Shell,
  StepCards,
  WhatsappBand,
} from "./chrome";

const BENEFICIOS = [
  "Avaliação sem compromisso",
  "Atendimento direto da loja",
  "Possibilidade de usar seu carro como entrada",
  "Agende a vistoria no melhor horário",
];

const PASSOS = [
  { title: "Conte sobre o carro", text: "Informe marca, modelo, ano e quilometragem." },
  { title: "Fale com a loja", text: "Nossa equipe entra em contato para validar os dados." },
  { title: "Faça a vistoria", text: "Agende uma avaliação presencial quando necessário." },
  {
    title: "Receba a proposta",
    text: "A loja apresenta as condições e você decide se quer seguir.",
  },
];

const AJUDA = [
  "Quilometragem atual",
  "Fotos recentes",
  "Versão e opcionais",
  "Histórico de manutenção",
  "Estado geral do veículo",
  "Documentação disponível",
];

export function SellCar({ site, links, sellForm }: SellCarProps) {
  return (
    <Shell site={site} links={links}>
      {/* ----------------------------------------------------------- herói */}
      <section className="border-b border-[var(--site-border)] bg-[var(--site-background)]">
        <div className={`${SHELL} grid grid-cols-1 items-start gap-10 py-14 lg:grid-cols-[minmax(0,1fr)_500px]`}>
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--site-primary)]">
              Venda seu carro
            </p>
            <h1
              className="max-w-md text-[34px] font-bold leading-tight text-[var(--site-text)] sm:text-[40px]"
              style={{ fontFamily: "var(--site-font-heading)" }}
            >
              Venda seu carro de forma simples e segura
            </h1>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-[var(--site-muted)]">
              Conte pra gente qual é o seu carro. Nossa equipe avalia os dados, entra em contato e
              apresenta uma proposta sem compromisso.
            </p>
            <CheckList items={BENEFICIOS} className="mt-6" />
          </div>

          <div className="rounded-[var(--site-radius)] border border-[var(--site-border)] bg-[var(--site-surface)] p-6">
            <p
              className="text-lg font-semibold text-[var(--site-text)]"
              style={{ fontFamily: "var(--site-font-heading)" }}
            >
              Comece sua avaliação
            </p>
            <p className="mt-1 text-[13px] leading-relaxed text-[var(--site-muted)]">
              Preencha os dados principais do veículo. A loja entra em contato para continuar a
              avaliação.
            </p>
            <div className="mt-5">{sellForm}</div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------- como funciona */}
      <section className={`${SHELL} py-14`}>
        <SectionHeading
          title="Como funciona"
          description="Da primeira informação até a proposta, sem complicação."
        />
        <StepCards steps={PASSOS} />
      </section>

      {/* ---------------------------------------- o que ajuda na avaliação */}
      <section className="border-y border-[var(--site-border)] bg-[var(--site-background)] py-14">
        <div className={`${SHELL} grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_400px]`}>
          <div>
            <SectionHeading
              title="O que ajuda na avaliação"
              description="Quanto mais informações você enviar, mais rápida tende a ser a análise inicial."
            />
            <CheckPills items={AJUDA} />
          </div>

          <div className="rounded-[var(--site-radius)] bg-[var(--site-text)] p-6 text-white">
            <p
              className="text-xl font-bold leading-tight"
              style={{ fontFamily: "var(--site-font-heading)" }}
            >
              Por que vender para a loja?
            </p>
            <p className="mt-2 text-sm leading-relaxed text-white/70">
              Um processo direto para quem quer vender ou usar o veículo atual na negociação.
            </p>
            <CheckList
              tone="dark"
              className="mt-6"
              items={[
                "Avaliação sem compromisso",
                "Negociação direta",
                "Seu carro pode entrar como parte do pagamento",
                "Atendimento e vistoria agendados",
              ]}
            />
          </div>
        </div>
      </section>

      {/* a faixa clara fecha a página sem competir com o rodapé escuro */}
      <WhatsappBand
        site={site}
        links={links}
        tone="light"
        title="Quer falar com alguém antes de preencher?"
        description="Nossa equipe pode orientar sobre os dados necessários e combinar a melhor forma de avaliação."
      />
    </Shell>
  );
}
