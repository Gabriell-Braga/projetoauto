"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastTone = "success" | "danger" | "info";

type Toast = {
  id: number;
  tone: ToastTone;
  message: string;
};

type ToastApi = {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

const TONE_RAIL: Record<ToastTone, string> = {
  success: "border-l-positive",
  danger: "border-l-danger",
  info: "border-l-accent",
};

const DURATION = 4000;

let nextId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback((tone: ToastTone, message: string) => {
    const id = nextId++;
    setToasts((current) => [...current.slice(-2), { id, tone, message }]);
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      success: (message) => push("success", message),
      error: (message) => push("danger", message),
      info: (message) => push("info", message),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2"
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), DURATION);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <div
      role="status"
      className={cn(
        "pointer-events-auto flex items-start gap-3 rounded border border-border border-l-2 bg-surface px-3 py-2.5",
        TONE_RAIL[toast.tone],
      )}
      style={{ boxShadow: "var(--shadow-menu)" }}
    >
      <p className="flex-1 text-[13px] leading-snug text-text">{toast.message}</p>
      <button
        type="button"
        aria-label="Fechar aviso"
        onClick={() => onDismiss(toast.id)}
        className="mt-0.5 shrink-0 text-faint transition-colors hover:text-text"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/** Fora do provider vira no-op: nenhuma tela quebra por falta de contexto. */
export function useToast(): ToastApi {
  const context = useContext(ToastContext);
  return (
    context ?? {
      success: () => {},
      error: () => {},
      info: () => {},
    }
  );
}
