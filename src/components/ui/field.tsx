import * as React from "react";
import { cn } from "@/lib/utils";
import { SelectMenu, type SelectOption } from "./select-menu";

/**
 * Campo do C4MP: 56px de altura, raio interno de 24px, fundo branco.
 *
 * O fundo é a superfície do card, não uma variação cinza: o sistema separa
 * por borda, e um cinza a mais criaria um degrau de superfície que o
 * documento não prevê.
 */
const baseField = [
  "w-full rounded-inner border border-border bg-surface px-6 text-base text-text",
  "transition-colors duration-200 ease-out",
  "hover:border-border-strong",
  "focus:border-accent focus:outline-none",
  "disabled:cursor-not-allowed disabled:opacity-60",
  "aria-[invalid=true]:border-danger",
].join(" ");

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn(baseField, "h-14", className)} {...props} />
  ),
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn(baseField, "min-h-32 resize-y py-4", className)} {...props} />
));
Textarea.displayName = "Textarea";

/**
 * Select com lista própria, mantendo a API do nativo.
 *
 * As telas continuam escrevendo `<Select value onChange><option/></Select>` —
 * as opções são lidas dos filhos e o onChange recebe algo com `target.value`.
 * Foram dezenas de usos: trocar a assinatura significaria reescrever todos, e
 * cada reescrita é uma chance de errar um campo em silêncio.
 *
 * Modo não-controlado continua existindo porque metade dos filtros usa
 * `defaultValue` + `name` dentro de formulário por GET.
 */
type SelectProps = Omit<
  React.SelectHTMLAttributes<HTMLSelectElement>,
  "onChange" | "value" | "defaultValue"
> & {
  value?: string;
  defaultValue?: string;
  onChange?: (event: { target: { value: string; name?: string } }) => void;
};

function readOptions(children: React.ReactNode): SelectOption[] {
  const options: SelectOption[] = [];

  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;

    // <optgroup> vira separador achatado: a lista já agrupa por ordem
    if (child.type === "optgroup") {
      const group = child.props as { children?: React.ReactNode };
      options.push(...readOptions(group.children));
      return;
    }
    if (child.type !== "option") return;

    const option = child.props as {
      value?: string | number;
      children?: React.ReactNode;
      disabled?: boolean;
    };
    const value = option.value === undefined ? "" : String(option.value);
    const label =
      typeof option.children === "string" || typeof option.children === "number"
        ? String(option.children)
        : value;

    options.push({ value, label, disabled: option.disabled });
  });

  return options;
}

export function Select({
  id,
  name,
  value,
  defaultValue,
  onChange,
  disabled,
  className,
  children,
  "aria-invalid": ariaInvalid,
}: SelectProps) {
  const options = React.useMemo(() => readOptions(children), [children]);

  const controlled = value !== undefined;
  const [internal, setInternal] = React.useState(defaultValue ?? "");
  const current = controlled ? String(value) : internal;

  /**
   * A opção de valor vazio serve de placeholder E continua na lista.
   *
   * Ela é o convite ("Escolha a marca") em uns campos e uma escolha de verdade
   * em outros ("Não informado"). Tirá-la da lista deixaria a pessoa sem como
   * voltar atrás depois de escolher — o campo viraria uma porta de mão única.
   */
  const placeholder = options.find((option) => option.value === "")?.label;

  return (
    <SelectMenu
      id={id}
      name={name}
      value={current}
      options={options}
      placeholder={placeholder ?? "Selecione"}
      disabled={disabled}
      className={className}
      aria-invalid={ariaInvalid === true || ariaInvalid === "true"}
      onSelect={(next) => {
        if (!controlled) setInternal(next);
        onChange?.({ target: { value: next, name } });
      }}
    />
  );
}

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("label-instrument mb-2 block text-text", className)} {...props} />;
}

export function FormField({
  label,
  hint,
  error,
  htmlFor,
  className,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    // rótulo → campo → hint, com 8px entre eles e 24px até o próximo campo
    <div className={cn("mb-6", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && !error ? <p className="mt-2 text-sm text-muted">{hint}</p> : null}
      {error ? (
        <p className="mt-2 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function Checkbox({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="checkbox"
      className={cn(
        "h-[18px] w-[18px] shrink-0 rounded border-border bg-surface text-accent",
        "accent-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        className,
      )}
      {...props}
    />
  );
}
