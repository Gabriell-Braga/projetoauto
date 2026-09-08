import { Check } from "lucide-react";
import type { FinancingProps } from "@/templates/contract";
import { SHELL, SectionHeading, Shell, WhatsappBand } from "./chrome";

const PASSOS = [
  {
    title: "Escolha o veículo",
    text: "Selecione um carro do estoque para a simulação partir do valor real.",
  },
  {
    title: "Informe a entrada",
    text: "Diga quanto pretende dar de entrada e em quantas parcelas quer pagar.",
  },
  {
    title: "Envie seus dados",
    text: "A loja recebe a simulação e retorna com as condições disponíveis.",
  },
  {
    title: "Feche com a equipe",
    text: "A aprovação e a taxa final saem da análise de crédito, junto com a loja.",
  },
];

const DOCUMENTOS = [
  "Documento de identificação com foto",
  "CPF",
  "Comprovante de residência atualizado",
  "Comprovante de renda",
  "Dados bancários",
];

export function Financing({ site, links, vehicles, defaults, simulatorForm }: FinancingProps) {
  return (
    <Shell site={site} links={links} active="financing">
      <section className="border-b border-[var(--site-border)] bg-[var(--site-background)]">
        <div className={`${SHELL} py-14`}>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--site-primary)]">
            Financiamento
          </p>
          <h1
            className="max-w-2xl text-[34px] font-bold leading-tight text-[var(--site-text)] sm:text-[40px]"
            style={{ fontFamily: "var(--site-font-heading)" }}
          >
            Simule seu próximo carro
          </h1>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-[var(--site-muted)]">
            Tenha uma estimativa inicial de entrada e prazo antes de falar com a equipe. Sem
            compromisso e sem consulta ao seu CPF.
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------- simulação */}
      <section className={`${SHELL} py-14`}>
        <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
          <div className="rounded-[var(--site-radius)] border border-[var(--site-border)] bg-[var(--site-surface)] p-6">
            <p
              className="text-lg font-semibold text-[var(--site-text)]"
              style={{ fontFamily: "var(--site-font-heading)" }}
            >
              Continue sua simulação
            </p>
            <p className="mt-1 text-[13px] text-[var(--site-muted)]">
              Deixe seus dados para a loja retornar com as condições do seu perfil.
            </p>

            {vehicles.length === 0 ? (
              <p className="mt-6 rounded-[var(--site-radius)] border border-[var(--site-border)] bg-[var(--site-background)] px-4 py-5 text-[13px] text-[var(--site-muted)]">
                Nenhum veículo com preço publicado no momento. Fale com a equipe pelo WhatsApp para
                simular uma condição.
              </p>
            ) : (
              <div className="mt-6">{simulatorForm}</div>
            )}
          </div>

          {/* `self-start`: a coluna de apoio tem pouco conteudo e nao deve esticar
            ate a altura do formulario — o vao vazio parece secao faltando */}
          <aside className="self-start rounded-[var(--site-radius)] border border-[var(--site-border)] bg-[var(--site-surface)] p-6">
            <p
              className="text-lg font-semibold text-[var(--site-text)]"
              style={{ fontFamily: "var(--site-font-heading)" }}
            >
              O que ter em mãos
            </p>
            <p className="mt-1 text-[13px] text-[var(--site-muted)]">
              A documentação pode variar conforme a análise do banco.
            </p>
            <ul className="mt-4 space-y-2.5">
              {DOCUMENTOS.map((item) => (
                <li key={item} className="flex items-start gap-2 text-[13px] text-[var(--site-text)]">
                  <Check
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--site-success)]"
                    aria-hidden="true"
                  />
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-5 border-t border-[var(--site-border)] pt-5 text-[13px] text-[var(--site-muted)]">
              <p>
                Entrada sugerida de{" "}
                <span className="font-medium text-[var(--site-text)]">
                  {defaults.downPaymentPercent}%
                </span>{" "}
                e prazos de {defaults.terms[0]} a {defaults.terms.at(-1)} meses.
              </p>
              <p className="mt-2">
                A parcela final depende da análise de crédito e é informada pela loja.
              </p>
            </div>
          </aside>
        </div>
      </section>

      {/* --------------------------------------------------- como funciona */}
      <section className="border-y border-[var(--site-border)] bg-[var(--site-background)] py-14">
        <div className={SHELL}>
          <SectionHeading
            title="Como funciona"
            description="Um processo simples para sair da simulação e chegar na proposta."
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PASSOS.map((passo, index) => (
              <div
                key={passo.title}
                className="rounded-[var(--site-radius)] border border-[var(--site-border)] bg-[var(--site-surface)] p-5"
              >
                <span className="inline-flex h-7 items-center rounded-full bg-[var(--site-background)] px-2.5 text-xs font-semibold text-[var(--site-primary)]">
                  {index + 1}
                </span>
                <h3
                  className="mt-3 text-base font-semibold text-[var(--site-text)]"
                  style={{ fontFamily: "var(--site-font-heading)" }}
                >
                  {passo.title}
                </h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--site-muted)]">
                  {passo.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <WhatsappBand
        site={site}
        links={links}
        title="Quer ajuda para simular?"
        description="Fale com a equipe e encontre uma condição que caiba no seu planejamento."
      />
    </Shell>
  );
}
