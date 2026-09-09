"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
export type MenuItem = { label: string; href: string };

/**
 * Cabeçalho do Showroom: sobreposto ao herói, com menu em gaveta.
 *
 * O desenho traz três estados de barra, e os três existem por um motivo
 * prático:
 *
 *   overlay   sobre o banner, sem fundo, para a foto ocupar a tela inteira;
 *   scrolled  fundo sólido depois que a pessoa passa do banner, senão o texto
 *             branco cai em cima do conteúdo claro e some;
 *   standard  fundo sólido desde o começo nas páginas que não têm banner.
 *
 * A navegação inteira vive na gaveta, inclusive no desktop. É o que permite o
 * topo ficar com três coisas apenas — menu, marca e contato — que é o ponto do
 * desenho: a foto do carro é a protagonista, não o menu.
 */
/*
 * Recebe TEXTO, e nao o objeto de links.
 *
 * `SiteLinks` carrega funcoes (`stockWith`, `whatsapp`, `vehicle`), e funcao nao
 * atravessa a fronteira servidor -> cliente: o React recusa a serializacao e a
 * pagina inteira responde 500. Quem monta os enderecos e a moldura, que roda
 * no servidor; aqui chegam strings prontas.
 */
export function ShowroomHeader({
  storeName,
  logoUrl,
  phone,
  homeHref,
  whatsappHref,
  todayHours,
  nav,
  categories,
  overlay,
}: {
  storeName: string;
  logoUrl: string | null;
  phone: string | null;
  homeHref: string;
  whatsappHref: string | null;
  todayHours: string | null;
  nav: MenuItem[];
  categories: MenuItem[];
  /** A página tem banner atrás do cabeçalho? Só a home tem. */
  overlay: boolean;
}) {
  const [aberto, setAberto] = useState(false);
  const [rolou, setRolou] = useState(false);

  /*
   * A troca acontece perto do fim do herói, não no primeiro pixel: mudar o
   * fundo assim que a pessoa encosta na roda faz a barra piscar durante uma
   * rolagem curta de leitura.
   */
  useEffect(() => {
    if (!overlay) return;
    const aoRolar = () => setRolou(window.scrollY > 120);
    aoRolar();
    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => window.removeEventListener("scroll", aoRolar);
  }, [overlay]);

  // Esc fecha, como qualquer camada que cobre a página
  useEffect(() => {
    if (!aberto) return;
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") setAberto(false);
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [aberto]);

  /*
   * Com o menu aberto a página de trás não rola.
   *
   * Sem isto, rolar dentro da gaveta arrasta o conteúdo por baixo dela, e ao
   * fechar a pessoa está num lugar que nunca escolheu.
   */
  useEffect(() => {
    if (!aberto) return;
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = anterior;
    };
  }, [aberto]);

  const solido = !overlay || rolou || aberto;
  const whatsapp = whatsappHref;
  const hoje = todayHours;
  const navegacao = nav;
  const categorias = categories;

  return (
    <header
      className={[
        "fixed inset-x-0 top-0 z-40 transition-colors duration-300",
        solido
          ? "bg-[var(--site-surface)] text-[var(--site-text)] shadow-[0_1px_0_0_var(--site-border)]"
          : "bg-transparent text-white",
      ].join(" ")}
    >
      <div className="mx-auto flex h-16 w-full max-w-[1280px] items-center gap-4 px-6">
        <button
          type="button"
          onClick={() => setAberto((valor) => !valor)}
          aria-expanded={aberto}
          className="inline-flex items-center gap-2 text-sm font-medium"
        >
          {aberto ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          {aberto ? "Fechar" : "Menu"}
        </button>

        {/* a marca fica no centro ótico, e não no fluxo: assim ela não desloca
            quando o texto do botão muda de "Menu" para "Fechar" */}
        <Link
          href={homeHref}
          className="absolute left-1/2 -translate-x-1/2 text-sm font-semibold uppercase tracking-[0.18em]"
          style={{ fontFamily: "var(--site-font-heading)" }}
        >
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={storeName} className="h-8 w-auto object-contain" />
          ) : (
            storeName
          )}
        </Link>

        <div className="ml-auto flex items-center gap-5">
          {phone ? (
            <span className="hidden text-sm md:inline">{phone}</span>
          ) : null}
          {whatsapp ? (
            <a
              href={whatsapp}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-[var(--site-radius)] bg-[var(--site-success)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-white/90" aria-hidden="true" />
              Falar no WhatsApp
            </a>
          ) : null}
        </div>
      </div>

      {aberto ? (
        <>
          {/* o painel desce do topo cobrindo o herói; o resto da página escurece */}
          <div className="border-t border-[var(--site-border)] bg-[var(--site-surface)] text-[var(--site-text)]">
            <div className="mx-auto grid w-full max-w-[1280px] grid-cols-1 gap-10 px-6 py-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--site-muted)]">
                  Navegação
                </p>

                <div className="mt-5 grid grid-cols-1 gap-x-10 gap-y-4 sm:grid-cols-2">
                  {navegacao.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setAberto(false)}
                      className="text-[26px] leading-none transition-colors hover:text-[var(--site-primary)]"
                      style={{ fontFamily: "var(--site-font-heading)" }}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>

                <div className="mt-8 border-t border-[var(--site-border)] pt-5">
                  <p className="text-[13px] text-[var(--site-muted)]">Explore o estoque</p>
                  <div className="mt-3 flex flex-wrap gap-x-8 gap-y-2">
                    {categorias.map((item) => (
                      <Link
                        key={item.label}
                        href={item.href}
                        onClick={() => setAberto(false)}
                        className="text-[13px] transition-colors hover:text-[var(--site-primary)]"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-[var(--site-radius)] bg-[var(--site-background)] p-6">
                <p className="text-[13px] text-[var(--site-muted)]">Atendimento</p>
                <p
                  className="mt-1 text-[22px] leading-tight"
                  style={{ fontFamily: "var(--site-font-heading)" }}
                >
                  Fale direto com a loja
                </p>

                {phone ? (
                  <p className="mt-4 text-lg font-medium">{phone}</p>
                ) : null}
                {hoje ? <p className="mt-1 text-[13px] text-[var(--site-muted)]">{hoje}</p> : null}

                {whatsapp ? (
                  <a
                    href={whatsapp}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-5 inline-flex w-full items-center justify-center rounded-[var(--site-radius)] bg-[var(--site-success)] px-5 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
                  >
                    Falar no WhatsApp
                  </a>
                ) : null}
              </div>
            </div>
          </div>

          {/* clicar fora fecha; é a saída que a pessoa tenta antes de procurar o × */}
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={() => setAberto(false)}
            className="fixed inset-0 -z-10 h-screen w-screen cursor-default bg-black/40"
          />
        </>
      ) : null}
    </header>
  );
}

/** A altura do cabeçalho fixo, para as páginas sem banner não passarem por baixo. */
export const HEADER_HEIGHT = "h-16";
