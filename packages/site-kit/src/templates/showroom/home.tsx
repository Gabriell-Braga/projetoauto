import Link from "next/link";
import type { HomeProps } from "../contract";
import { formatCurrency } from "../../lib/format";
import { HERO_GRADIENT, HERO_VARS, RuledRow, SHELL, SectionHeading, Shell, TalkBand } from "./chrome";
import { SearchCard } from "./search-card";
import { VehicleGrid } from "./vehicle-card";

const EXPECTATIVAS = [
  {
    title: "Estoque selecionado",
    text: "Veículos apresentados com informações claras e atualizadas.",
  },
  {
    title: "Compra segura",
    text: "Atendimento para orientar cada etapa da negociação.",
  },
  {
    title: "Financiamento",
    text: "Condições para diferentes perfis, sujeitas à análise.",
  },
  {
    title: "Atendimento direto",
    text: "Você fala com a própria equipe da loja, sem intermediários.",
  },
];

export function Home({ site, links, featured, latest, facets, totalVehicles }: HomeProps) {
  const destaques = [...featured, ...latest].slice(0, 4);
  const banner = site.banners[0]?.imageUrl ?? null;

  const categorias = [
    { title: "SUV", text: "Altos e versáteis", href: links.stockWith({ carroceria: "suv" }) },
    { title: "Hatches", text: "Compactos e urbanos", href: links.stockWith({ carroceria: "hatch" }) },
    { title: "Sedãs", text: "Conforto e espaço", href: links.stockWith({ carroceria: "sedan" }) },
    { title: "Picapes", text: "Força e utilidade", href: links.stockWith({ carroceria: "picape" }) },
    {
      title: "Até R$ 80 mil",
      text: "Boas oportunidades",
      href: links.stockWith({ precoMax: 80000 }),
    },
    {
      title: "Automáticos",
      text: "Mais conveniência",
      href: links.stockWith({ cambio: "automatico" }),
    },
  ];

  /*
   * A simulação da home é um EXEMPLO, não uma calculadora.
   *
   * É o que o desenho pede aqui: três linhas mostrando como a conta se parece,
   * e o botão levando para a página onde ela é feita de verdade. Repetir a
   * calculadora inteira nesta seção competiria com o card de busca logo acima,
   * que é a ação principal da home.
   */
  const exemplo = destaques[0];
  const exemploEntrada = exemplo
    ? Math.round((exemplo.priceCents * site.financing.downPaymentPercent) / 100)
    : 0;
  const exemploPrazo = site.financing.terms.includes(48) ? 48 : (site.financing.terms[0] ?? 48);

  return (
    <Shell site={site} links={links} overlay>
      {/* ----------------------------------------------------------- herói */}
      <section
        className={"relative pb-32 pt-28 text-white " + HERO_GRADIENT}
        style={HERO_VARS}
      >
        <div className={`${SHELL} text-center`}>
          <h1
            className="mx-auto max-w-[20ch] text-[40px] leading-[1.12] sm:text-[52px]"
            style={{ fontFamily: "var(--site-font-heading)" }}
          >
            Encontre o carro que combina com você.
          </h1>
          <p className="mx-auto mt-4 max-w-[52ch] text-[14px] leading-relaxed text-white/70">
            Estoque selecionado, atendimento direto e uma experiência de compra simples do início ao
            fim.
          </p>

          {/* proporcao do desenho: faixa larga e baixa, nao 16:9 */}
          <div className="mt-10 aspect-[38/10] overflow-hidden rounded-[var(--site-radius)] bg-white/15">
            {banner ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={banner} alt={site.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-[11px] uppercase tracking-[0.14em] text-white/60">
                Foto / vídeo do estoque
              </div>
            )}
          </div>
        </div>
      </section>

      {/* o cartão de busca encosta no pé do herói, como no desenho */}
      <div className={`${SHELL} -mt-24 relative z-10`}>
        <SearchCard links={links} facets={facets} />
      </div>

      {/* ------------------------------------------------------ categorias */}
      <section className={`${SHELL} py-14`}>
        <SectionHeading
          title="Escolha pelo seu estilo"
          description="Encontre rapidamente o tipo de carro que combina com a sua rotina."
        />
        <RuledRow items={categorias} />
      </section>

      {/* -------------------------------------------------------- destaques */}
      {destaques.length > 0 ? (
        <section className="bg-[var(--site-background)] py-14">
          <div className={SHELL}>
            <SectionHeading
              title="Destaques do estoque"
              description="Veículos selecionados com informações claras para você comparar."
              action={
                <Link
                  href={links.stock}
                  className="text-[13px] text-[var(--site-primary)] hover:underline"
                >
                  Ver estoque completo →
                </Link>
              }
            />
            <VehicleGrid
              vehicles={destaques}
              links={links}
              storeName={site.name}
              columns={4}
            />
          </div>
        </section>
      ) : null}

      <TalkBand
        site={site}
        links={links}
        title="Quer conversar antes de decidir?"
        description="Fale direto com a equipe sobre estoque, troca ou financiamento."
      />

      {/* ----------------------------------------------------- expectativas */}
      <section className={`${SHELL} py-14`}>
        <SectionHeading
          title="O que você pode esperar da loja"
          description="Uma experiência de compra orientada por informação e atendimento direto."
        />
        <RuledRow items={EXPECTATIVAS} columns={4} />
      </section>

      {/* ----------------------------------------------------- financiamento */}
      <section className="bg-[var(--site-background)] py-16">
        <div className={`${SHELL} grid grid-cols-1 items-center gap-10 lg:grid-cols-2`}>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--site-primary)]">
              Financiamento
            </p>
            <h2
              className="mt-3 max-w-[18ch] text-[32px] leading-tight"
              style={{ fontFamily: "var(--site-font-heading)" }}
            >
              Encontre uma condição que caiba no seu plano.
            </h2>
            <p className="mt-3 max-w-[46ch] text-[13px] leading-relaxed text-[var(--site-muted)]">
              Simule entrada e prazo e envie seus dados para a loja continuar o atendimento.
            </p>
            <Link
              href={links.financing}
              className="mt-6 inline-flex rounded-[var(--site-radius)] bg-[var(--site-primary)] px-5 py-3 text-[13px] font-medium text-[var(--site-primary-foreground)] transition-colors hover:bg-[var(--site-primary-hover)]"
            >
              Simular financiamento
            </Link>
          </div>

          {exemplo ? (
            <div className="rounded-[var(--site-radius)] bg-[var(--site-surface)] p-6">
              <p className="text-sm font-medium">Exemplo de simulação</p>
              <dl className="mt-5 divide-y divide-[var(--site-border)] text-[13px]">
                <div className="flex items-center justify-between py-3">
                  <dt className="text-[var(--site-muted)]">Valor do veículo</dt>
                  <dd>{formatCurrency(exemplo.priceCents)}</dd>
                </div>
                <div className="flex items-center justify-between py-3">
                  <dt className="text-[var(--site-muted)]">Entrada</dt>
                  <dd>{formatCurrency(exemploEntrada)}</dd>
                </div>
                <div className="flex items-center justify-between py-3">
                  <dt className="text-[var(--site-muted)]">Prazo</dt>
                  <dd>{exemploPrazo} meses</dd>
                </div>
              </dl>
              <p className="mt-4 text-[12px] text-[var(--site-primary)]">
                Parcela estimada após análise de crédito.
              </p>
            </div>
          ) : null}
        </div>
      </section>

      {/* ---------------------------------------------------------- sobre */}
      <section className={`${SHELL} grid grid-cols-1 items-center gap-10 py-16 lg:grid-cols-2`}>
        <div className="aspect-4/3 overflow-hidden rounded-[var(--site-radius)] bg-[var(--site-background)]">
          {site.banners[1]?.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={site.banners[1].imageUrl}
              alt={site.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-[11px] uppercase tracking-[0.14em] text-[var(--site-muted)]">
              Foto da loja / equipe
            </div>
          )}
        </div>

        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--site-primary)]">
            Sobre a loja
          </p>
          <h2
            className="mt-3 max-w-[20ch] text-[32px] leading-tight"
            style={{ fontFamily: "var(--site-font-heading)" }}
          >
            {site.aboutTitle ?? "Atendimento de quem entende de carro e de gente."}
          </h2>
          <p className="mt-3 max-w-[48ch] text-[13px] leading-relaxed text-[var(--site-muted)]">
            {site.aboutText ??
              "Conheça a loja, nossa forma de trabalhar e como ajudamos em compra, troca e financiamento."}
          </p>
          <Link
            href={links.about}
            className="mt-6 inline-flex rounded-[var(--site-radius)] border border-[var(--site-border)] px-5 py-3 text-[13px] font-medium transition-colors hover:border-[var(--site-primary)]"
          >
            Conhecer a loja{totalVehicles > 0 ? ` (${totalVehicles})` : ""}
          </Link>
        </div>
      </section>
    </Shell>
  );
}
