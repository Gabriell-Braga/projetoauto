import type { FinancingProps } from "../contract";
import { RuledRow, SHELL, SectionHeading, Shell, TalkBand } from "./chrome";

const ETAPAS = [
  { title: "Escolha o veículo", text: "Selecione o carro do estoque que você quer financiar." },
  { title: "Defina a entrada", text: "Quanto maior a entrada, menor a parcela e o custo total." },
  { title: "Compare prazos", text: "Prazo longo alivia a parcela e aumenta o total pago." },
  { title: "Envie seus dados", text: "A loja retorna com as condições disponíveis para o perfil." },
];

const DUVIDAS = [
  {
    title: "A parcela mostrada é garantida?",
    text: "Não. Ela é uma estimativa; o valor final sai da análise de crédito da instituição.",
  },
  {
    title: "Preciso de entrada?",
    text: "Na maioria dos casos sim, e o percentual varia conforme o perfil e o veículo.",
  },
  {
    title: "Posso usar meu carro como entrada?",
    text: "Pode. A loja avalia o usado e ele entra como parte do pagamento.",
  },
  {
    title: "Em quanto tempo recebo retorno?",
    text: "A equipe responde dentro do horário de atendimento da loja.",
  },
];

export function Financing({ site, links, simulatorForm, leadForm }: FinancingProps) {
  return (
    <Shell site={site} links={links}>
      {/* ----------------------------------------------------------- herói */}
      <section className="bg-[var(--site-background)] py-14">
        <div
          className={`${SHELL} grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,1fr)_460px]`}
        >
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--site-primary)]">
              Financiamento
            </p>
            <h1
              className="mt-3 max-w-[16ch] text-[40px] leading-[1.1]"
              style={{ fontFamily: "var(--site-font-heading)" }}
            >
              Encontre uma condição que caiba no seu plano.
            </h1>
            <p className="mt-4 max-w-[52ch] text-[14px] leading-relaxed text-[var(--site-muted)]">
              Simule entrada e prazo para o veículo que você quer. Depois, nossa equipe ajuda a
              encontrar as condições disponíveis para o seu perfil.
            </p>
          </div>

          <div className="rounded-[var(--site-radius)] bg-[var(--site-surface)] p-6">
            <p className="text-[17px]" style={{ fontFamily: "var(--site-font-heading)" }}>
              Simule seu financiamento
            </p>
            <p className="mt-1 text-[12px] text-[var(--site-muted)]">
              O valor final depende da análise e das condições disponíveis.
            </p>
            <div className="mt-5">{simulatorForm}</div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------- etapas */}
      <section className={`${SHELL} py-14`}>
        <SectionHeading
          title="Como funciona"
          description="Quatro passos, do primeiro número até a resposta da loja."
        />
        <RuledRow items={ETAPAS} columns={4} />
      </section>

      {/* ------------------------------------------------------------ lead */}
      <section id="continuar" className="scroll-mt-24 bg-[var(--site-background)] py-14">
        <div
          className={`${SHELL} grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,1fr)_520px]`}
        >
          <div>
            <h2
              className="max-w-[18ch] text-[30px] leading-tight"
              style={{ fontFamily: "var(--site-font-heading)" }}
            >
              Envie seus dados e continue com a equipe.
            </h2>
            <p className="mt-3 max-w-[46ch] text-[13px] leading-relaxed text-[var(--site-muted)]">
              A simulação acima é uma estimativa. Com seus dados, a loja consulta as condições reais
              e retorna pelo canal que você preferir.
            </p>
          </div>

          <div className="rounded-[var(--site-radius)] bg-[var(--site-surface)] p-6">{leadForm}</div>
        </div>
      </section>

      {/* ---------------------------------------------------------- dúvidas */}
      <section className={`${SHELL} py-14`}>
        <SectionHeading title="Dúvidas frequentes" />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {DUVIDAS.map((item) => (
            <div
              key={item.title}
              className="rounded-[var(--site-radius)] border border-[var(--site-border)] p-5"
            >
              <p className="text-[14px] font-medium">{item.title}</p>
              <p className="mt-2 text-[13px] leading-relaxed text-[var(--site-muted)]">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      <TalkBand
        site={site}
        links={links}
        title="Prefere falar antes de simular?"
        description="A equipe explica as condições disponíveis e ajuda a montar a proposta."
      />
    </Shell>
  );
}
