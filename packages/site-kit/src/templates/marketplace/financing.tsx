import type { FinancingProps } from "../contract";
import { HelpBand, SHELL, SectionHeading, Shell } from "./chrome";

const PASSOS = [
  { numero: "01", title: "Escolha o veículo", text: "Selecione o carro do estoque." },
  { numero: "02", title: "Defina a entrada", text: "Entrada maior deixa a parcela menor." },
  { numero: "03", title: "Compare prazos", text: "Prazo longo alivia a parcela e eleva o total." },
  { numero: "04", title: "Envie seus dados", text: "A loja retorna com as condições do seu perfil." },
];

const DUVIDAS = [
  {
    title: "A parcela mostrada é garantida?",
    text: "Não. É uma estimativa; o valor final sai da análise de crédito da instituição.",
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
      <section className="bg-[var(--site-background)] py-12">
        <div
          className={`${SHELL} grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,1fr)_460px]`}
        >
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--site-primary)]">
              Financiamento
            </p>
            <h1
              className="mt-3 max-w-[16ch] text-[36px] font-bold leading-[1.1]"
              style={{ fontFamily: "var(--site-font-heading)" }}
            >
              Simule antes de falar com a loja.
            </h1>
            <p className="mt-4 max-w-[50ch] text-[14px] leading-relaxed text-[var(--site-muted)]">
              Escolha o veículo, defina a entrada e compare prazos. Depois envie seus dados para a
              equipe consultar as condições reais.
            </p>
          </div>

          <div className="rounded-[var(--site-radius)] border border-[var(--site-border)] bg-[var(--site-surface)] p-6">
            <p className="text-[16px] font-semibold" style={{ fontFamily: "var(--site-font-heading)" }}>
              Simule seu financiamento
            </p>
            <p className="mt-1 text-[12px] text-[var(--site-muted)]">
              O valor final depende da análise e das condições disponíveis.
            </p>
            <div className="mt-5">{simulatorForm}</div>
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

      <section id="continuar" className="scroll-mt-24 bg-[var(--site-background)] py-12">
        <div
          className={`${SHELL} grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,1fr)_520px]`}
        >
          <div>
            <h2
              className="max-w-[18ch] text-[28px] font-bold leading-tight"
              style={{ fontFamily: "var(--site-font-heading)" }}
            >
              Envie seus dados e continue com a equipe.
            </h2>
            <p className="mt-3 max-w-[46ch] text-[13px] leading-relaxed text-[var(--site-muted)]">
              A simulação acima é uma estimativa. Com seus dados, a loja consulta as condições reais
              e retorna pelo canal que você preferir.
            </p>
          </div>

          <div className="rounded-[var(--site-radius)] border border-[var(--site-border)] bg-[var(--site-surface)] p-6">
            {leadForm}
          </div>
        </div>
      </section>

      <section className={`${SHELL} py-12`}>
        <SectionHeading title="Dúvidas frequentes" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

      <HelpBand
        site={site}
        links={links}
        title="Prefere falar antes de simular?"
        description="A equipe explica as condições disponíveis e ajuda a montar a proposta."
      />
    </Shell>
  );
}
