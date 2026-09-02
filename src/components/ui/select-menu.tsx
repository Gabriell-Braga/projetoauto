"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search } from "lucide-react";
import { filterOptions, fold } from "@/lib/format/option-filter";
import { cn } from "@/lib/utils";

export type SelectOption = { value: string; label: string; disabled?: boolean };

/** Teto do painel aberto, usado para escolher o lado da abertura. */
const MENU_MAX_H = 300;

/**
 * A partir daqui a lista ganha campo de busca.
 *
 * Abaixo disso a busca atrapalha: numa lista de quatro situações de anúncio
 * ela rouba a primeira linha do painel e ainda pede um alvo a mais para quem
 * só queria ver as opções. Acima, procurar com o olho custa mais que digitar
 * — a lista de marcas da FIPE passa de noventa, e a de modelos, de quinhentas.
 */
const SEARCH_FROM = 8;

/**
 * Lista de opções própria, no lugar do dropdown do sistema operacional.
 *
 * O menu nativo é desenhado pelo sistema: fonte, cores e cantos vêm do
 * Windows ou do macOS, e num painel inteiro em Montserrat, com o raio do
 * sistema, ele aparece como um corpo estranho.
 *
 * Três decisões que o desenho impõe:
 *
 * 1. O painel é renderizado em portal, com posição fixa. Card e accordion
 *    recortam o próprio conteúdo para respeitar o raio do card, e um menu
 *    dentro deles seria cortado na primeira opção.
 *
 * 2. Um campo oculto acompanha o valor. Metade dos selects do painel é
 *    não-controlada e vai dentro de formulário de verdade — filtro por GET,
 *    cadastro por FormData. Sem o campo oculto, esses formulários enviariam
 *    o filtro vazio.
 *
 * 3. Lista longa abre com campo de busca. O nativo só oferece o salto por
 *    letra, que exige acertar o começo do nome e não avisa que existe.
 */
export function SelectMenu({
  id,
  name,
  value,
  options,
  placeholder = "Selecione",
  disabled,
  className,
  onSelect,
  "aria-invalid": ariaInvalid,
}: {
  id?: string;
  name?: string;
  value: string;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  onSelect: (value: string) => void;
  "aria-invalid"?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(-1);
  const [rect, setRect] = React.useState<DOMRect | null>(null);
  const [above, setAbove] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const listRef = React.useRef<HTMLUListElement>(null);
  const searchRef = React.useRef<HTMLInputElement>(null);
  const typeahead = React.useRef({ term: "", at: 0 });
  const listId = React.useId();

  const searchable = options.length >= SEARCH_FROM;

  const visible = React.useMemo(() => filterOptions(options, query), [options, query]);

  const selected = options.find((option) => option.value === value);
  const firstSelectable = React.useCallback(
    (list: SelectOption[]) => list.findIndex((option) => !option.disabled),
    [],
  );

  /**
   * A direção é decidida uma vez, na abertura, e não muda mais.
   *
   * Recalcular a cada quadro faria o menu virar de lado no meio da rolagem,
   * saltando de baixo do campo para cima dele — e a opção sob o cursor troca
   * junto.
   */
  function openMenu() {
    if (disabled) return;

    const element = triggerRef.current;
    if (element) {
      const box = element.getBoundingClientRect();
      setRect(box);
      setAbove(window.innerHeight - box.bottom < MENU_MAX_H && box.top > MENU_MAX_H);
    }

    setQuery("");
    setActiveIndex(options.findIndex((option) => option.value === value));
    setOpen(true);
  }

  function closeMenu(returnFocus = true) {
    setOpen(false);
    setActiveIndex(-1);
    setQuery("");
    if (returnFocus) triggerRef.current?.focus();
  }

  function choose(index: number) {
    const option = visible[index];
    if (!option || option.disabled) return;
    onSelect(option.value);
    closeMenu();
  }

  // o foco vai para a busca; sem isso a pessoa abre a lista, digita e nada
  // acontece — o que lê como campo travado, não como campo sem foco
  React.useEffect(() => {
    if (open && searchable) searchRef.current?.focus();
  }, [open, searchable]);

  /**
   * Filtrar move a marcação para o primeiro resultado.
   *
   * Sem isso ela fica onde estava — às vezes num item que o filtro acabou de
   * esconder — e Enter escolhe algo que não está na tela. Fica no evento, e
   * não num efeito: `options` chega novo a cada render do pai, e um efeito
   * que dependesse dele rodaria a cada render, desfazendo a marcação que o
   * mouse acabou de pôr.
   */
  function search(next: string) {
    setQuery(next);
    const list = filterOptions(options, next);
    setActiveIndex(
      next.trim()
        ? firstSelectable(list)
        : list.findIndex((option) => option.value === value),
    );
  }

  /**
   * Rolagem acompanha o gatilho em vez de fechar o menu.
   *
   * Fechar em qualquer rolagem parecia simples e quebrava o caso mais comum:
   * a lista de modelos da FIPE tem quinhentas linhas, e rolar dentro dela
   * dispara um evento de rolagem como qualquer outro — o menu fechava no
   * primeiro giro da roda. O ouvinte é de captura, então ele vê inclusive a
   * rolagem de dentro do painel; ela é ignorada, porque não move o gatilho.
   *
   * Para a rolagem de fora, reposicionar é melhor que fechar: um quadro por
   * vez, com o cálculo preso ao rAF para não medir o layout várias vezes no
   * mesmo quadro. Só quando o gatilho sai inteiro da tela o menu fecha — aí
   * ele apontaria para um campo que a pessoa não vê mais.
   */
  React.useEffect(() => {
    if (!open) return;

    let frame = 0;

    function follow(event: Event) {
      if (event.type === "scroll" && panelRef.current?.contains(event.target as Node)) return;
      if (frame) return;

      frame = requestAnimationFrame(() => {
        frame = 0;
        const element = triggerRef.current;
        if (!element) return;

        const next = element.getBoundingClientRect();
        if (next.bottom < 0 || next.top > window.innerHeight) {
          closeMenu(false);
          return;
        }
        setRect(next);
      });
    }

    window.addEventListener("scroll", follow, true);
    window.addEventListener("resize", follow);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", follow, true);
      window.removeEventListener("resize", follow);
    };
  }, [open]);

  React.useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      closeMenu(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  // mantém a opção ativa visível quando a lista é longa
  React.useEffect(() => {
    if (!open || activeIndex < 0) return;
    listRef.current
      ?.querySelector(`[data-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [open, activeIndex]);

  function step(direction: 1 | -1) {
    setActiveIndex((current) => {
      if (visible.length === 0) return -1;
      let next = current;
      for (let i = 0; i < visible.length; i++) {
        next = (next + direction + visible.length) % visible.length;
        if (!visible[next]?.disabled) return next;
      }
      return current;
    });
  }

  /** Salto por letra, para as listas curtas que não têm campo de busca. */
  function jumpTo(letter: string) {
    const now = Date.now();
    const state = typeahead.current;
    state.term = now - state.at > 800 ? letter : state.term + letter;
    state.at = now;

    const index = visible.findIndex(
      (option) => !option.disabled && fold(option.label).startsWith(state.term),
    );
    if (index >= 0) setActiveIndex(index);
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (!open) {
      if (["Enter", " ", "ArrowDown", "ArrowUp"].includes(event.key)) {
        event.preventDefault();
        openMenu();
      }
      return;
    }

    switch (event.key) {
      case "Escape":
        event.preventDefault();
        closeMenu();
        break;
      case "ArrowDown":
        event.preventDefault();
        step(1);
        break;
      case "ArrowUp":
        event.preventDefault();
        step(-1);
        break;
      case "Home":
      case "End":
        // com campo de busca, essas teclas pertencem ao cursor do texto
        if (searchable) break;
        event.preventDefault();
        setActiveIndex(
          event.key === "Home"
            ? firstSelectable(visible)
            : visible.map((option) => !option.disabled).lastIndexOf(true),
        );
        break;
      case "Enter":
        event.preventDefault();
        choose(activeIndex);
        break;
      case " ":
        // espaço faz parte do que se digita na busca; só vira "escolher" nas
        // listas curtas, onde não há onde digitar
        if (searchable) break;
        event.preventDefault();
        choose(activeIndex);
        break;
      case "Tab":
        closeMenu(false);
        break;
      default:
        if (!searchable && event.key.length === 1) jumpTo(fold(event.key));
    }
  }

  return (
    <>
      {name ? <input type="hidden" name={name} value={value} /> : null}

      <button
        ref={triggerRef}
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-invalid={ariaInvalid}
        disabled={disabled}
        onClick={() => (open ? closeMenu() : openMenu())}
        onKeyDown={onKeyDown}
        className={cn(
          "flex h-10 w-full items-center justify-between gap-2 rounded-inner border border-border",
          "bg-surface px-3.5 text-left text-sm text-text transition-colors duration-200 ease-out",
          "hover:border-border-strong focus-visible:border-accent",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
          "disabled:cursor-not-allowed disabled:opacity-60",
          "aria-[invalid=true]:border-danger",
          open && "border-accent",
          className,
        )}
      >
        {/* valor vazio é tratado como ausência, mesmo tendo rótulo próprio */}
        <span className={cn("truncate", (!selected || value === "") && "text-faint")}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-faint transition-transform duration-200 ease-out",
            open && "rotate-180",
          )}
        />
      </button>

      {open && rect
        ? createPortal(
            <div
              ref={panelRef}
              style={{
                position: "fixed",
                left: rect.left,
                width: rect.width,
                ...(above
                  ? { bottom: window.innerHeight - rect.top + 4 }
                  : { top: rect.bottom + 4 }),
              }}
              className="z-50 overflow-hidden rounded-inner border border-border bg-surface shadow-[var(--shadow-menu)]"
            >
              {searchable ? (
                <div className="flex items-center gap-2 border-b border-border px-3 py-2">
                  <Search aria-hidden="true" className="h-4 w-4 shrink-0 text-faint" />
                  <input
                    ref={searchRef}
                    type="text"
                    value={query}
                    onChange={(event) => search(event.target.value)}
                    onKeyDown={onKeyDown}
                    placeholder="Filtrar"
                    aria-label="Filtrar opções"
                    aria-controls={listId}
                    aria-activedescendant={
                      activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined
                    }
                    autoComplete="off"
                    spellCheck={false}
                    className="h-6 w-full bg-transparent text-sm text-text outline-none placeholder:text-faint"
                  />
                </div>
              ) : null}

              <ul
                ref={listRef}
                id={listId}
                role="listbox"
                aria-activedescendant={activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
                tabIndex={-1}
                // overscroll-contain: chegar ao fim da lista não repassa a
                // rolagem para a página atrás dela
                className="max-h-60 overflow-y-auto overscroll-contain py-1.5"
              >
                {visible.length === 0 ? (
                  <li className="px-3.5 py-2 text-sm text-faint">
                    {query ? "Nada encontrado" : "Nada para escolher"}
                  </li>
                ) : (
                  visible.map((option, index) => {
                    const active = index === activeIndex;
                    const chosen = option.value === value;
                    return (
                      <li
                        key={option.value + index}
                        id={`${listId}-${index}`}
                        role="option"
                        aria-selected={chosen}
                        aria-disabled={option.disabled}
                        data-index={index}
                        onMouseEnter={() => !option.disabled && setActiveIndex(index)}
                        onClick={() => choose(index)}
                        className={cn(
                          "flex cursor-pointer items-center justify-between gap-3 px-3.5 py-2 text-sm",
                          option.disabled && "cursor-not-allowed opacity-40",
                          active && !option.disabled && "bg-surface-2",
                          chosen ? "text-accent-text" : "text-text",
                        )}
                      >
                        <span className="min-w-0">{option.label}</span>
                        {chosen ? <Check className="h-4 w-4 shrink-0" /> : null}
                      </li>
                    );
                  })
                )}
              </ul>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
