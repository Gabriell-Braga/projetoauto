"use client";

import * as React from "react";
import { Input } from "@/components/ui/field";
import {
  centsToCurrencyInput,
  formatCurrencyInput,
  formatIntegerInput,
  parseCurrencyToCents,
  parseIntegerInput,
} from "@/lib/format/number-input";

type Base = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange" | "type" | "inputMode"
>;

/**
 * Campo de dinheiro no padrão brasileiro.
 *
 * Guarda centavos e mostra "79.900,00". O componente é controlado pelo texto
 * digitado, não pelo número: reformatar a partir do valor a cada tecla moveria
 * o cursor e trocaria o número debaixo do dedo de quem está digitando.
 *
 * O texto só é reconstruído a partir dos centavos quando eles mudam por fora —
 * quando a consulta à FIPE preenche o preço, por exemplo.
 */
export function CurrencyInput({
  valueCents,
  onChangeCents,
  ...props
}: Base & {
  valueCents: number;
  onChangeCents: (cents: number) => void;
}) {
  const [text, setText] = React.useState(() => centsToCurrencyInput(valueCents));

  React.useEffect(() => {
    if (parseCurrencyToCents(text) !== valueCents) setText(centsToCurrencyInput(valueCents));
    // de propósito só reage à mudança externa; o texto se governa
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valueCents]);

  return (
    <Input
      {...props}
      inputMode="decimal"
      value={text}
      onChange={(event) => {
        const formatted = formatCurrencyInput(event.target.value);
        setText(formatted);
        onChangeCents(parseCurrencyToCents(formatted));
      }}
    />
  );
}

/**
 * Campo de número inteiro com separador de milhar.
 *
 * Vazio permanece vazio em vez de virar zero: zero é uma resposta, vazio é a
 * ausência dela, e num campo de quilometragem os dois significam coisas
 * diferentes.
 */
export function IntegerInput({
  value,
  onChangeNumber,
  ...props
}: Base & {
  value: number;
  onChangeNumber: (value: number) => void;
}) {
  const [text, setText] = React.useState(() => (value ? formatIntegerInput(String(value)) : ""));

  React.useEffect(() => {
    if (parseIntegerInput(text) !== value) {
      setText(value ? formatIntegerInput(String(value)) : "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <Input
      {...props}
      inputMode="numeric"
      value={text}
      onChange={(event) => {
        const formatted = formatIntegerInput(event.target.value);
        setText(formatted);
        onChangeNumber(parseIntegerInput(formatted));
      }}
    />
  );
}
