"use client";

import { useId, useState } from "react";

/**
 * Abas da ficha do veículo, como no desenho: Informações, Galeria, Opcionais.
 *
 * O conteúdo das três vem montado do servidor e fica no HTML desde o começo —
 * o que muda é qual está visível. Assim o buscador lê a ficha inteira, e quem
 * chega sem JavaScript vê a primeira aba em vez de uma página vazia.
 *
 * `hidden` em vez de desmontar: trocar de aba não recarrega imagem já baixada,
 * então a galeria não pisca ao voltar para ela.
 */
export function Tabs({
  items,
}: {
  items: { id: string; label: string; content: React.ReactNode }[];
}) {
  const base = useId();
  const [ativa, setAtiva] = useState(items[0]?.id ?? "");

  return (
    <div>
      <div
        role="tablist"
        aria-label="Seções do veículo"
        className="flex gap-8 border-b border-[var(--site-border)]"
      >
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={`${base}-${item.id}-tab`}
            aria-selected={ativa === item.id}
            aria-controls={`${base}-${item.id}-panel`}
            onClick={() => setAtiva(item.id)}
            className={[
              "-mb-px border-b-2 pb-3 text-[13px] transition-colors",
              ativa === item.id
                ? "border-[var(--site-primary)] font-medium text-[var(--site-text)]"
                : "border-transparent text-[var(--site-muted)] hover:text-[var(--site-text)]",
            ].join(" ")}
          >
            {item.label}
          </button>
        ))}
      </div>

      {items.map((item) => (
        <div
          key={item.id}
          role="tabpanel"
          id={`${base}-${item.id}-panel`}
          aria-labelledby={`${base}-${item.id}-tab`}
          hidden={ativa !== item.id}
          className="site-enter pt-10"
        >
          {item.content}
        </div>
      ))}
    </div>
  );
}
