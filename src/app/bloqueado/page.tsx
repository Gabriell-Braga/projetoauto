import type { Metadata } from "next";
import { LogoutButton } from "@/components/layout/logout-button";

export const metadata: Metadata = { title: "Acesso suspenso" };
export const dynamic = "force-dynamic";

export default function BlockedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-ink-100 px-4">
      <div className="w-full max-w-md rounded-xl border border-ink-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-lg font-semibold text-ink-900">Acesso temporariamente suspenso</h1>
        <p className="mt-2 text-sm text-ink-500">
          O acesso ao painel desta revenda está suspenso. Entre em contato com o suporte para
          regularizar a situação e reativar o serviço.
        </p>
        <div className="mx-auto mt-6 w-40 text-ink-900">
          <div className="rounded-lg bg-ink-950 px-2 py-1">
            <LogoutButton />
          </div>
        </div>
      </div>
    </main>
  );
}
