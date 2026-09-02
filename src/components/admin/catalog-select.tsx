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
 * A saída fica DENTRO da lista, como "Outro (digitar)". A versão anterior
 * trocava sozinha para campo de texto quando não havia opções — e como lista
 * vazia também é o estado de "ainda carregando" e de "escolha a marca
 * primeiro", o campo anunciava catálogo indisponível quando nada havia
 * falhado. Agora o select é sempre o select, e quem decide digitar é a pessoa.
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
  loading,
  placeholder = "Escolha",
}: {
  id: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  disabled?: boolean;
  /** Carregando é diferente de vazio: um espera, o outro é escolha da pessoa. */
  loading?: boolean;
  placeholder?: string;
}) {
  const [typing, setTyping] = useState(false);
  const known = value && !options.includes(value) ? [value, ...options] : options;

  if (typing) {
    return (
      <div className="flex items-center gap-3">
        <Input
          id={id}
          value={value}
          disabled={disabled}
          autoFocus
          onChange={(event) => onChange(event.target.value)}
        />
        <button
          type="button"
          onClick={() => setTyping(false)}
          className="shrink-0 text-sm text-muted underline-offset-2 hover:text-text hover:underline"
        >
          lista
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Select
        id={id}
        value={value}
        disabled={disabled || loading}
        onChange={(event) => {
          if (event.target.value === OTHER) {
            setTyping(true);
            onChange("");
            return;
          }
          onChange(event.target.value);
        }}
      >
        <option value="">{loading ? "Carregando..." : placeholder}</option>
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
        disabled={disabled}
        onClick={() => setTyping(true)}
        className="shrink-0 text-faint transition-colors hover:text-text disabled:opacity-40"
      >
        <Pencil className="h-6 w-6" />
      </button>
    </div>
  );
}
