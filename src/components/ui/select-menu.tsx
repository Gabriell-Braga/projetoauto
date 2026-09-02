"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type SelectOption = { value: string; label: string; disabled?: boolean };

/** Teto da lista — o mesmo valor de `max-h-64`, usado para escolher o lado. */
const MENU_MAX_H = 256;

/**
 * Lista de opções própria, no lugar do dropdown do sistema operacional.
 *
 * O menu nativo é desenhado pelo sistema: fonte, cores e cantos vêm do
 * Windows ou do macOS, e num painel inteiro em Montserrat, com o raio do
 * sistema, ele aparece como um corpo estranho.
 *
 * Duas decisões que o desenho impõe:
 *
 * 1. O painel é renderizado em portal, com posição fixa. Card e accordion
 *    recortam o próprio conteúdo para respeitar o raio do card, e um menu
 *    dentro deles seria cortado na primeira opção.
 *
 * 2. Um campo oculto acompanha o valor. Metade dos selects do painel é
 *    não-controlada e vai dentro de formulário de verdade — filtro por GET,
 *    cadastro por FormData. Sem o campo oculto, esses formulários enviariam
 *    o filtro vazio.
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

  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const listRef = React.useRef<HTMLUListElement>(null);
  const typeahead = React.useRef({ term: "", at: 0 });
  const listId = React.useId();

  const selected = options.find((option) => option.value === value);
  const selectable = React.useCallback(
    (index: number) => options[index] && !options[index].disabled,
    [options],
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

    setActiveIndex(options.findIndex((option) => option.value === value));
    setOpen(true);
  }

  function closeMenu(returnFocus = true) {
    setOpen(false);
    setActiveIndex(-1);
    if (returnFocus) triggerRef.current?.focus();
  }

  function choose(index: number) {
    const option = options[index];
    if (!option || option.disabled) return;
    onSelect(option.value);
    closeMenu();
  }

  /**
   * Rolagem acompanha o gatilho em vez de fechar o menu.
   *
   * Fechar em qualquer rolagem parecia simples e quebrava o caso mais comum:
   * a lista de modelos da FIPE tem quinhentas linhas, e rolar dentro dela
   * dispara um evento de rolagem como qualquer outro — o menu fechava no
   * primeiro giro da roda. O ouvinte é de captura, então ele vê inclusive a
   * rolagem da própria lista; ela é ignorada, porque não move o gatilho.
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
      if (event.type === "scroll" && listRef.current?.contains(event.target as Node)) return;
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
      if (triggerRef.current?.contains(target) || listRef.current?.contains(target)) return;
      closeMenu(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  // mantém a opção ativa visível quando a lista é longa (modelos da FIPE
  // passam de quinhentos)
  React.useEffect(() => {
    if (!open || activeIndex < 0) return;
    listRef.current
      ?.querySelector(`[data-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [open, activeIndex]);

  function step(direction: 1 | -1) {
    setActiveIndex((current) => {
      let next = current;
      for (let i = 0; i < options.length; i++) {
        next = (next + direction + options.length) % options.length;
        if (selectable(next)) return next;
      }
      return current;
    });
  }

  /** Digitar uma letra pula para a opção — o nativo faz isso e some sem aviso. */
  function jumpTo(letter: string) {
    const now = Date.now();
    const state = typeahead.current;
    state.term = now - state.at > 800 ? letter : state.term + letter;
    state.at = now;

    const index = options.findIndex(
      (option) => !option.disabled && option.label.toLowerCase().startsWith(state.term),
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
        event.preventDefault();
        setActiveIndex(options.findIndex((option) => !option.disabled));
        break;
      case "End":
        event.preventDefault();
        setActiveIndex(options.map((option) => !option.disabled).lastIndexOf(true));
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        choose(activeIndex);
        break;
      case "Tab":
        closeMenu(false);
        break;
      default:
        if (event.key.length === 1) jumpTo(event.key.toLowerCase());
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
            <ul
              ref={listRef}
              id={listId}
              role="listbox"
              aria-activedescendant={activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
              tabIndex={-1}
              style={{
                position: "fixed",
                left: rect.left,
                width: rect.width,
                ...(above
                  ? { bottom: window.innerHeight - rect.top + 4 }
                  : { top: rect.bottom + 4 }),
              }}
              // overscroll-contain: chegar ao fim da lista não repassa a
              // rolagem para a página atrás dela
              className="z-50 max-h-64 overflow-y-auto overscroll-contain rounded-inner border border-border bg-surface py-1.5 shadow-[var(--shadow-menu)]"
            >
              {options.length === 0 ? (
                <li className="px-3.5 py-2 text-sm text-faint">Nada para escolher</li>
              ) : (
                options.map((option, index) => {
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
            </ul>,
            document.body,
          )
        : null}
    </>
  );
}
