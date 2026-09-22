"use client";

import * as React from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Área que rola na horizontal com aviso de que há mais coisa ali.
 *
 * Uma tabela larga no celular cortava na borda sem sinal nenhum: a pessoa
 * via só a primeira coluna e achava que era a tabela inteira. Aqui a borda
 * de onde ainda tem conteúdo ganha um esmaecido, e enquanto ninguém rolou
 * aparece a dica "deslize" — some no primeiro toque, porque a partir daí a
 * pessoa já sabe.
 */
export function ScrollEdges({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [left, setLeft] = React.useState(false);
  const [right, setRight] = React.useState(false);
  const [touched, setTouched] = React.useState(false);

  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const update = () => {
      const max = element.scrollWidth - element.clientWidth;
      setLeft(element.scrollLeft > 1);
      setRight(max - element.scrollLeft > 1);
    };
    const onScroll = () => {
      setTouched(true);
      update();
    };

    update();
    element.addEventListener("scroll", onScroll, { passive: true });

    // a largura muda quando a janela gira ou quando as fotos chegam
    const observer = new ResizeObserver(update);
    observer.observe(element);
    if (element.firstElementChild) observer.observe(element.firstElementChild);

    return () => {
      element.removeEventListener("scroll", onScroll);
      observer.disconnect();
    };
  }, []);

  return (
    <div className={cn("relative", className)}>
      <div ref={ref} className="w-full overflow-x-auto">
        {children}
      </div>

      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-surface to-transparent transition-opacity duration-200",
          left ? "opacity-100" : "opacity-0",
        )}
      />
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-surface to-transparent transition-opacity duration-200",
          right ? "opacity-100" : "opacity-0",
        )}
      />

      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full border border-border bg-surface-2 px-2.5 py-1 text-[11px] font-medium text-muted shadow-sm transition-opacity duration-200",
          right && !touched ? "opacity-100" : "opacity-0",
        )}
      >
        Deslize
        <ChevronRight className="h-3 w-3" />
      </div>
    </div>
  );
}
