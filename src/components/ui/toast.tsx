"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastTone = "success" | "danger" | "info";

type Toast = {
  id: number;
  tone: ToastTone;
  title: string;
  description?: string;
};

export type ToastApi = {
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

const TONE = {
  success: { rail: "border-l-positive", icon: CheckCircle2, color: "text-positive" },
  danger: { rail: "border-l-danger", icon: AlertCircle, color: "text-danger" },
  info: { rail: "border-l-accent", icon: Info, color: "text-accent" },
} as const;

/** Erro fica mais tempo na tela: quem errou precisa ler o que aconteceu. */
const DURATION: Record<ToastTone, number> = {
  success: 4000,
  info: 5000,
  danger: 8000,
};

const MAX_VISIBLE = 3;

let nextId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback((tone: ToastTone, title: string, description?: string) => {
    const id = nextId++;
    setToasts((current) => [...current.slice(-(MAX_VISIBLE - 1)), { id, tone, title, description }]);
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      success: (title, description) => push("success", title, description),
      error: (title, description) => push("danger", title, description),
      info: (title, description) => push("info", title, description),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2"
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
  const { rail, icon: Icon, color } = TONE[toast.tone];

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), DURATION[toast.tone]);
    return () => clearTimeout(timer);
  }, [toast.id, toast.tone, onDismiss]);

  return (
    <div
      role={toast.tone === "danger" ? "alert" : "status"}
      className={cn(
        "pointer-events-auto flex items-start gap-2.5 rounded border border-border border-l-2 bg-surface px-3 py-2.5",
        rail,
      )}
      style={{ boxShadow: "var(--shadow-menu)" }}
    >
      <Icon aria-hidden="true" className={cn("mt-0.5 h-4 w-4 shrink-0", color)} />
      <div className="min-w-0 flex-1">
        <p className="text-base font-medium leading-snug text-text">{toast.title}</p>
        {toast.description ? (
          <p className="mt-0.5 text-xs leading-snug text-muted">{toast.description}</p>
        ) : null}
      </div>
      <button
        type="button"
        aria-label="Fechar aviso"
        onClick={() => onDismiss(toast.id)}
        className="mt-0.5 shrink-0 rounded-sm text-faint transition-colors hover:text-text"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/**
 * O provider vive no layout raiz, então em produção o contexto sempre existe.
 * O fallback só entra em cenários de teste/render isolado — e grita no console
 * em vez de engolir a mensagem, que foi exatamente como um erro de formulário
 * sumiu da tela uma vez.
 */
function loudFallback(): ToastApi {
  const warn = (tone: string) => (title: string, description?: string) => {
    console.error(
      `[toast:${tone}] sem ToastProvider na árvore — mensagem não exibida:`,
      title,
      description ?? "",
    );
  };
  return { success: warn("success"), error: warn("error"), info: warn("info") };
}

export function useToast(): ToastApi {
  return useContext(ToastContext) ?? loudFallback();
}
