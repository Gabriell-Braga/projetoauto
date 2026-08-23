import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar" };
export const dynamic = "force-dynamic";

const ERROR_MESSAGES: Record<string, string> = {
  tenant: "Não foi possível carregar sua revenda. Fale com o suporte.",
  sessao: "Sua sessão expirou. Entre novamente.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; erro?: string }>;
}) {
  const params = await searchParams;
  const message = params.erro ? ERROR_MESSAGES[params.erro] : null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-ink-100 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-lg font-bold text-white">
            P
          </div>
          <h1 className="text-xl font-semibold text-ink-900">Acessar o painel</h1>
          <p className="mt-1 text-sm text-ink-500">
            Gestão de estoque, leads e site da sua revenda.
          </p>
        </div>

        <div className="rounded-xl border border-ink-200 bg-white p-6 shadow-sm">
          {message ? (
            <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {message}
            </p>
          ) : null}
          <LoginForm next={params.next} />
        </div>

        <p className="mt-6 text-center text-xs text-ink-500">
          Esqueceu a senha? Fale com o administrador da sua revenda.
        </p>
      </div>
    </main>
  );
}
