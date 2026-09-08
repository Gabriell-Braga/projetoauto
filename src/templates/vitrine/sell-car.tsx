import { Check } from "lucide-react";
import type { SellCarProps } from "@/templates/contract";
import { SHELL, SectionHeading, Shell, WhatsappBand } from "./chrome";

const PASSOS = [
  { title: "Envie os dados", text: "Marca, modelo, ano e quilometragem do seu veículo." },
  { title: "Recebemos e analisamos", text: "A equipe consulta a tabela de referência e o mercado." },
  { title: "Falamos com você", text: "Retornamos com uma estimativa e combinamos a vistoria." },
  { title: "Fechamos o negócio", text: "Com o carro avaliado de perto, o valor final é confirmado." },
];

const AJUDA = [
  "Quilometragem real do painel",
  "Se há registro de sinistro",
  "Estado dos pneus e da lataria",
  "Revisões feitas e manutenção pendente",
  "Débitos em aberto: IPVA, multas ou financiamento",
];

export function SellCar({ site, links, sellForm }: SellCarProps) {
  return (
    <Shell site={site} links={links} active="sellCar">
      <section className="border-b border-[var(--site-border)] bg-[var(--site-background)]">
        <div className={`${SHELL} py-14`}>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--site-primary)]">
            Venda seu carro
          </p>
          <h1
            className="max-w-2xl text-[34px] font-bold leading-tight text-[var(--site-text)] sm:text-[40px]"
            style={{ fontFamily: "var(--site-font-heading)" }}
          >
            Venda seu carro de forma simples e segura
          </h1>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-[var(--site-muted)]">
            Conte pra gente qual é o seu carro. Nossa equipe avalia e retorna com uma proposta —
            para venda direta ou como parte do pagamento do próximo.
          </p>
        </div>
      </section>

      <section className={`${SHELL} py-14`}>
        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <div className="rounded-[var(--site-radius)] border border-[var(--site-border)] bg-[var(--site-surface)] p-6">
            <p
              className="text-lg font-semibold text-[var(--site-text)]"
              style={{ fontFamily: "var(--site-font-heading)" }}
            >
              Dados do seu veículo
            </p>
            <p className="mt-1 text-[13px] text-[var(--site-muted)]">
              Quanto mais completo, mais precisa fica a estimativa.
            </p>
            <div className="mt-6">{sellForm}</div>
          </div>

          {/* `self-start`: a coluna de apoio tem pouco conteudo e nao deve esticar
            ate a altura do formulario — o vao vazio parece secao faltando */}
          <aside className="self-start rounded-[var(--site-radius)] border border-[var(--site-border)] bg-[var(--site-surface)] p-6">
            <p
              className="text-lg font-semibold text-[var(--site-text)]"
              style={{ fontFamily: "var(--site-font-heading)" }}
            >
              O que ajuda na avaliação
            </p>
            <p className="mt-1 text-[13px] text-[var(--site-muted)]">
              Você pode contar isso no campo de observações.
            </p>
            <ul className="mt-4 space-y-2.5">
              {AJUDA.map((item) => (
                <li key={item} className="flex items-start gap-2 text-[13px] text-[var(--site-text)]">
                  <Check
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--site-success)]"
                    aria-hidden="true"
                  />
                  {item}
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </section>

      <section className="border-y border-[var(--site-border)] bg-[var(--site-background)] py-14">
        <div className={SHELL}>
          <SectionHeading
            title="Como funciona"
            description="Da primeira informação até a proposta, sem burocracia."
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
        title="Quer falar com alguém antes de preencher?"
        description="Nossa equipe pode orientar sobre os dados necessários e o processo de avaliação."
      />
    </Shell>
  );
}
