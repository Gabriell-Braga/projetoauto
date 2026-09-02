"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type SelectOption = { value: string; label: string; disabled?: boolean };

/**
 * Lista de opções própria, no lugar do dropdown do sistema operacional.
 *
 * O menu nativo é desenhado pelo sistema: fonte, cores e cantos vêm do
 * Windows ou do macOS, e num painel inteiro em Montserrat com raio de 24px ele
 * aparece como um corpo estranho.
 *
 * Duas decisões que o desenho impõe:
 *
 * 1. O painel é renderizado em portal, com posição fixa. Card e accordion
 *    recortam o próprio conteúdo para respeitar o raio de 40px, e um menu
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

  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const listRef = React.useRef<HTMLUListElement>(null);
  const typeahead = React.useRef({ term: "", at: 0 });
  const listId = React.useId();

  const selected = options.find((option) => option.value === value);
  const selectable = React.useCallback(
    (index: number) => options[index] && !options[index].disabled,
    [options],
  );

  const place = React.useCallback(() => {
    const element = triggerRef.current;
    if (element) setRect(element.getBoundingClientRect());
  }, []);

  function openMenu() {
    if (disabled) return;
    place();
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
   * Rolagem e redimensionamento fecham o menu.
   *
   * Ele é posicionado por coordenada da tela; reposicionar a cada quadro de
   * rolagem custa caro e ainda assim treme. Fechar é honesto: o gatilho saiu
   * do lugar que a pessoa olhava.
   */
  React.useEffect(() => {
    if (!open) return;

    const onScroll = () => closeMenu(false);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
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
          "flex h-14 w-full items-center justify-between gap-4 rounded-inner border border-border",
          "bg-surface px-6 text-left text-base text-text transition-colors duration-200 ease-out",
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
            "h-6 w-6 shrink-0 text-faint transition-transform duration-200 ease-out",
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
                // abre para cima quando não há espaço embaixo
                ...(window.innerHeight - rect.bottom < 280 && rect.top > 280
                  ? { bottom: window.innerHeight - rect.top + 8 }
                  : { top: rect.bottom + 8 }),
              }}
              className="z-50 max-h-72 overflow-y-auto rounded-inner border border-border bg-surface py-2 shadow-[var(--shadow-menu)]"
            >
              {options.length === 0 ? (
                <li className="px-6 py-3 text-base text-faint">Nada para escolher</li>
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
                        "flex cursor-pointer items-center justify-between gap-4 px-6 py-3 text-base",
                        option.disabled && "cursor-not-allowed opacity-40",
                        active && !option.disabled && "bg-surface-2",
                        chosen ? "text-accent-text" : "text-text",
                      )}
                    >
                      <span className="min-w-0">{option.label}</span>
                      {chosen ? <Check className="h-5 w-5 shrink-0" /> : null}
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
