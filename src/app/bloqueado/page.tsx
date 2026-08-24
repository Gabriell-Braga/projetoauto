import type { Metadata } from "next";
import { LogoutButton } from "@/components/layout/logout-button";

export const metadata: Metadata = { title: "Acesso suspenso" };
export const dynamic = "force-dynamic";

export default function BlockedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-md rounded border border-border bg-surface p-8">
        <p className="label-instrument text-accent-text">Acesso suspenso</p>
        <h1 className="mt-2 text-[20px] leading-tight text-text">
          O painel desta revenda está bloqueado
        </h1>
        <p className="mt-3 text-[13px] leading-relaxed text-muted">
          Fale com o suporte para regularizar a situação e reativar o acesso.
        </p>
        <div className="mt-6 border-t border-border pt-5">
          <LogoutButton />
        </div>
      </div>
    </main>
  );
}
