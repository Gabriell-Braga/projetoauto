"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { Button } from "./button";
import { Dialog } from "./dialog";

export type ConfirmOptions = {
  title: string;
  /** O que exatamente vai acontecer. Evite repetir o título. */
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** `danger` pinta o botão de confirmar — use para o que não se desfaz. */
  tone?: "default" | "danger";
};

export type ConfirmApi = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmApi | null>(null);

/**
 * Confirmação em diálogo próprio.
 *
 * `window.confirm` desenha uma caixa do navegador: tipografia, cores e botões
 * do sistema operacional, no meio de uma interface que não se parece com nada
 * disso. Além da identidade, ele trava a thread e não aceita rótulo próprio —
 * "OK" e "Cancelar" para excluir um plano dizem menos do que "Excluir plano".
 */
export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmApi>((next) => {
    return new Promise<boolean>((resolve) => {
      // um pedido novo com outro aberto: o antigo responde "não" e some
      resolverRef.current?.(false);
      resolverRef.current = resolve;
      setOptions(next);
    });
  }, []);

  const settle = useCallback((answer: boolean) => {
    resolverRef.current?.(answer);
    resolverRef.current = null;
    setOptions(null);
  }, []);

  const api = useMemo(() => confirm, [confirm]);

  return (
    <ConfirmContext.Provider value={api}>
      {children}
      {options ? (
        <Dialog
          open
          onClose={() => settle(false)}
          title={options.title}
          description={options.description}
          footer={
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => settle(false)}>
                {options.cancelLabel ?? "Cancelar"}
              </Button>
              <Button
                type="button"
                variant={options.tone === "danger" ? "danger" : "primary"}
                onClick={() => settle(true)}
              >
                {options.confirmLabel ?? "Confirmar"}
              </Button>
            </div>
          }
        />
      ) : null}
    </ConfirmContext.Provider>
  );
}

/**
 * Sem provider na árvore, avisa alto e nega a ação.
 *
 * Negar é a resposta segura: um `true` silencioso executaria a exclusão sem
 * ninguém ter confirmado nada.
 */
export function useConfirm(): ConfirmApi {
  const api = useContext(ConfirmContext);
  if (api) return api;

  return async (options) => {
    console.error(
      "[confirm] sem ConfirmProvider na árvore — ação negada por segurança:",
      options.title,
    );
    return false;
  };
}
