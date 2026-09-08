import type { FinancingProps } from "../contract";
import {
  CheckList,
  CheckPills,
  SHELL,
  SectionHeading,
  Shell,
  StepCards,
  WhatsappButton,
} from "./chrome";

const BENEFICIOS = [
  "Escolha o valor do veículo",
  "Defina uma entrada",
  "Compare prazos",
  "Fale com a loja para continuar",
];

const PASSOS = [
  { title: "Escolha o carro", text: "Selecione um veículo do estoque e use o valor como base." },
  { title: "Simule", text: "Defina entrada e prazo para ter uma referência inicial." },
  { title: "Envie seus dados", text: "A loja recebe sua solicitação e entra em contato." },
  {
    title: "Análise e proposta",
    text: "As condições finais dependem da análise de crédito e da instituição financeira.",
  },
];

const DOCUMENTOS = [
  "Documento de identificação",
  "CPF",
  "Comprovante de residência",
  "Comprovante de renda ou movimentação financeira",
];

export function Financing({
  site,
  links,
  simulatorForm,
  leadForm,
}: FinancingProps) {
  return (
    <Shell site={site} links={links} active="financing">
      {/* ----------------------------------------------------------- herói */}
      <section className="border-b border-[var(--site-border)] bg-[var(--site-background)]">
        <div className={`${SHELL} grid grid-cols-1 items-start gap-10 py-14 lg:grid-cols-[minmax(0,1fr)_420px]`}>
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--site-primary)]">
              Financiamento
            </p>
            <h1
              className="max-w-xl text-[34px] font-bold leading-tight text-[var(--site-text)] sm:text-[40px]"
              style={{ fontFamily: "var(--site-font-heading)" }}
            >
              Simule seu próximo carro
            </h1>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-[var(--site-muted)]">
              Tenha uma estimativa inicial de entrada e prazo para o veículo que você quer. Depois,
              nossa equipe ajuda a encontrar as condições disponíveis para o seu perfil.
            </p>
            <CheckList items={BENEFICIOS} className="mt-6" />
          </div>

          <div className="rounded-[var(--site-radius)] border border-[var(--site-border)] bg-[var(--site-surface)] p-6">
            <p
              className="text-lg font-semibold text-[var(--site-text)]"
              style={{ fontFamily: "var(--site-font-heading)" }}
            >
              Simule seu financiamento
            </p>
            <p className="mt-1 text-[13px] leading-relaxed text-[var(--site-muted)]">
              Preencha uma estimativa. O valor final depende da análise e das condições
              disponíveis.
            </p>
            <div className="mt-5">{simulatorForm}</div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------- continue sua simulação */}
      <section id="continuar" className={`${SHELL} py-14`}>
        <SectionHeading
          title="Continue sua simulação"
          description="Deixe seus dados para a loja retornar com as opções disponíveis para o seu perfil e para o veículo de interesse."
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="rounded-[var(--site-radius)] border border-[var(--site-border)] bg-[var(--site-background)] p-6">
            {leadForm}
          </div>

          <div className="flex flex-col rounded-[var(--site-radius)] bg-[var(--site-text)] p-6 text-white">
            <p
              className="text-xl font-bold leading-tight"
              style={{ fontFamily: "var(--site-font-heading)" }}
            >
              Prefere falar com alguém?
            </p>
            <p className="mt-2 text-sm leading-relaxed text-white/70">
              Nossa equipe pode ajudar a escolher um veículo, entender entrada e prazo e seguir com
              a análise.
            </p>

            <CheckList
              tone="dark"
              className="mt-6"
              items={[
                "Atendimento direto da loja",
                "Sem compromisso",
                "Condições sujeitas à análise",
              ]}
            />

            <div className="mt-auto pt-6">
              <WhatsappButton
                href={links.whatsapp(
                  `Olá! Quero simular um financiamento com a ${site.name}.`,
                )}
                className="w-full !rounded-[var(--site-radius)]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------- como funciona */}
      <section className="border-y border-[var(--site-border)] bg-[var(--site-background)] py-14">
        <div className={SHELL}>
          <SectionHeading
            title="Como funciona"
            description="Um processo simples para sair da simulação e chegar à proposta."
          />
          <StepCards steps={PASSOS} />
        </div>
      </section>

      {/* ------------------------------------------------ o que ter em mãos */}
      <section className={`${SHELL} py-14`}>
        <SectionHeading
          title="O que ter em mãos"
          description="A documentação pode variar conforme a análise, mas estes dados costumam ser necessários."
        />

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <CheckPills items={DOCUMENTOS} />

          <aside className="rounded-[var(--site-radius)] bg-[var(--site-primary)]/[0.06] p-6">
            <p
              className="text-base font-semibold text-[var(--site-text)]"
              style={{ fontFamily: "var(--site-font-heading)" }}
            >
              Importante saber
            </p>
            <p className="mt-3 text-[13px] leading-relaxed text-[var(--site-muted)]">
              A simulação exibida no site é apenas uma estimativa inicial.
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-[var(--site-muted)]">
              Taxa, parcela, entrada mínima, prazo e aprovação podem mudar conforme o perfil, o
              veículo e a instituição financeira.
            </p>
            <p className="mt-3 text-[13px] font-medium leading-relaxed text-[var(--site-text)]">
              A loja confirma as condições antes de qualquer contratação.
            </p>
          </aside>
        </div>
      </section>
    </Shell>
  );
}
