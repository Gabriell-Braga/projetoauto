"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { Input, Select } from "@/components/ui/field";

const OTHER = "__outro__";

/**
 * Escolha de catálogo com saída de emergência.
 *
 * Lista fechada é o certo aqui: marca e modelo digitados à mão viram "VW",
 * "Volkswagen" e "volks" no mesmo estoque, e o filtro do site passa a mostrar
 * três marcas onde existe uma.
 *
 * Mas lista fechada sozinha trava o cadastro quando o catálogo não carrega —
 * e a FIPE é serviço de terceiro. Daí a opção "outro": mantém a padronização
 * no caminho normal sem deixar a revenda refém de um serviço fora do ar.
 *
 * O valor atual sempre entra na lista, mesmo fora do catálogo. Sem isso, abrir
 * um veículo antigo e salvar apagaria o que estava lá, sem ninguém ver.
 */
export function CatalogSelect({
  id,
  value,
  options,
  onChange,
  disabled,
  placeholder = "Escolha",
  emptyHint = "Catálogo indisponível — digite",
}: {
  id: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  emptyHint?: string;
}) {
  const known = value && !options.includes(value) ? [value, ...options] : options;

  // sem catálogo, cai direto no texto: um select vazio não deixaria cadastrar
  const [typing, setTyping] = useState(false);
  const asText = typing || (options.length === 0 && !value);

  if (asText) {
    return (
      <div className="flex items-center gap-1.5">
        <Input
          id={id}
          value={value}
          disabled={disabled}
          autoFocus={typing}
          placeholder={options.length === 0 ? emptyHint : undefined}
          onChange={(event) => onChange(event.target.value)}
        />
        {options.length > 0 ? (
          <button
            type="button"
            onClick={() => setTyping(false)}
            className="shrink-0 text-xs text-muted underline-offset-2 hover:text-text hover:underline"
          >
            lista
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <Select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(event) => {
          if (event.target.value === OTHER) {
            setTyping(true);
            onChange("");
            return;
          }
          onChange(event.target.value);
        }}
      >
        <option value="">{placeholder}</option>
        {known.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
        <option value={OTHER}>Outro (digitar)</option>
      </Select>
      <button
        type="button"
        aria-label="Digitar em vez de escolher"
        title="Digitar"
        onClick={() => setTyping(true)}
        className="shrink-0 text-faint transition-colors hover:text-text"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
