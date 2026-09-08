"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { filterOptions } from "@/lib/format/option-filter";

export type SearchableOption = { id: string; label: string };

/**
 * Seletor de veículo com busca.
 *
 * Uma revenda com duzentos carros no seletor nativo é uma lista impossível: os
 * nomes começam iguais ("Volkswagen T-Cross Highline…" ao lado de "Volkswagen
 * T-Cross Comfortline…"), e rolar até achar o certo custa mais que desistir.
 *
 * O filtro reaproveita `filterOptions`, o mesmo do painel: busca por trecho e
 * ignora acento e caixa, então "citroen" acha Citroën e "cross" acha o T-Cross
 * no meio do nome.
 *
 * O que ele guarda é o ID, não o texto. Um seletor por texto casaria errado
 * quando dois carros tivessem o mesmo nome — e a pessoa enviaria a simulação do
 * carro errado sem ver que trocou.
 */
export function SearchableSelect({
  id,
  options,
  value,
  onChange,
  placeholder = "Selecione o veículo",
  emptyLabel = "Nenhum veículo encontrado",
}: {
  id?: string;
  options: SearchableOption[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  emptyLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  // useId, e não um contador de módulo: servidor e cliente precisam gerar o
  // MESMO id, senão a hidratação reclama e o React remonta o componente
  const listId = useId();

  const wrapper = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = options.find((option) => option.id === value) ?? null;
  const visible = useMemo(() => filterOptions(options, query), [options, query]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!wrapper.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  // o foco vai para a busca ao abrir; sem isso a pessoa digitaria no vazio
  useEffect(() => {
    if (open) searchRef.current?.focus();
  }, [open]);

  function choose(option: SearchableOption) {
    onChange(option.id);
    setOpen(false);
    setQuery("");
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((current) => Math.min(current + 1, visible.length - 1));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((current) => Math.max(current - 1, 0));
      return;
    }
    if (event.key === "Enter" && visible[active]) {
      event.preventDefault();
      choose(visible[active]);
    }
  }

  return (
    <div ref={wrapper} className="relative">
      <button
        id={id}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-haspopup="listbox"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-2 rounded-[var(--site-radius)] border border-[var(--site-border)] bg-[var(--site-surface)] px-3.5 py-2.5 text-left text-sm text-[var(--site-text)] outline-none transition-colors focus:border-[var(--site-primary)]"
      >
        {/*
          `min-w-0`: sem ele o `truncate` não corta nada. Filho de flex tem
          largura mínima igual ao conteúdo, então o nome longo do veículo empurra
          o botão para fora da tela em vez de virar reticências.
        */}
        <span
          className={
            selected ? "min-w-0 truncate" : "min-w-0 truncate text-[var(--site-muted)]"
          }
        >
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-[var(--site-muted)]" aria-hidden="true" />
      </button>

      {open ? (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-[var(--site-radius)] border border-[var(--site-border)] bg-[var(--site-surface)] shadow-lg">
          <div className="flex items-center gap-2 border-b border-[var(--site-border)] px-3 py-2">
            <Search className="h-4 w-4 shrink-0 text-[var(--site-muted)]" aria-hidden="true" />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setActive(0);
              }}
              onKeyDown={onKeyDown}
              placeholder="Buscar por marca ou modelo"
              aria-label="Buscar veículo"
              autoComplete="off"
              className="w-full bg-transparent text-sm text-[var(--site-text)] outline-none placeholder:text-[var(--site-muted)]"
            />
          </div>

          <ul
            id={listId}
            role="listbox"
            className="max-h-60 overflow-y-auto overscroll-contain py-1"
          >
            {visible.length === 0 ? (
              <li className="px-3.5 py-2.5 text-sm text-[var(--site-muted)]">{emptyLabel}</li>
            ) : (
              visible.map((option, index) => (
                <li
                  key={option.id}
                  role="option"
                  aria-selected={option.id === value}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => choose(option)}
                  className={
                    index === active
                      ? "cursor-pointer bg-[var(--site-background)] px-3.5 py-2.5 text-sm text-[var(--site-text)]"
                      : "cursor-pointer px-3.5 py-2.5 text-sm text-[var(--site-text)]"
                  }
                >
                  <span className="block truncate">{option.label}</span>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
