"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/** Falha inesperada dentro do app — mantém a identidade e oferece saída. */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app] erro não tratado:", error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-md rounded border border-border bg-surface p-8">
        <p className="label-instrument text-danger">Falha inesperada</p>
        <h1 className="mt-2 text-[20px] leading-tight text-text">Algo quebrou nesta tela</h1>
        <p className="mt-3 text-[13px] leading-relaxed text-muted">
          O erro foi registrado. Tente de novo — se continuar, avise o suporte com o código abaixo.
        </p>

        {error.digest ? (
          <code className="mt-4 block rounded border border-border bg-surface-2 px-2.5 py-2 text-xs text-muted">
            {error.digest}
          </code>
        ) : null}

        <div className="mt-6 flex gap-2 border-t border-border pt-5">
          <Button type="button" onClick={reset}>
            Tentar de novo
          </Button>
          <Link href="/login">
            <Button type="button" variant="ghost">
              Ir para o login
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
