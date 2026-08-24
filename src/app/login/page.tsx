import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Alert } from "@/components/ui/alert";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import {
  DEFAULT_THEME_PREFERENCE,
  THEME_COOKIE,
  isThemePreference,
  type ThemePreference,
} from "@/lib/theme";
import { InstrumentPanel } from "./instrument-panel";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar" };
export const dynamic = "force-dynamic";

const ERROR_MESSAGES: Record<string, string> = {
  tenant: "Não foi possível carregar sua revenda. Fale com o suporte.",
  sessao: "Sua sessão expirou. Entre novamente.",
};

function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={`font-display font-bold uppercase leading-none tracking-[0.18em] text-text ${className ?? ""}`}
    >
      ProjetoAuto
    </span>
  );
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; erro?: string }>;
}) {
  const params = await searchParams;
  const message = params.erro ? ERROR_MESSAGES[params.erro] : null;

  const cookieValue = (await cookies()).get(THEME_COOKIE)?.value;
  const preference: ThemePreference = isThemePreference(cookieValue)
    ? cookieValue
    : DEFAULT_THEME_PREFERENCE;

  return (
    <main className="grid min-h-screen bg-bg lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      {/* ------------------------------------------------ formulário */}
      <div className="flex flex-col px-6 py-8 sm:px-10">
        <header className="flex items-center justify-between">
          <Wordmark className="text-[13px] lg:invisible" />
          <ThemeToggle current={preference} />
        </header>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-[340px]">
            <p className="label-instrument text-accent-text">Acesso restrito</p>
            <h1 className="mt-2 text-[22px] leading-tight text-text">Entrar no painel</h1>
            <p className="mt-1.5 text-[13px] text-muted">
              Estoque, leads e site da sua revenda em um lugar só.
            </p>

            {message ? (
              <div className="mt-5">
                <Alert tone="warning">{message}</Alert>
              </div>
            ) : null}

            <div className="mt-7">
              <LoginForm next={params.next} />
            </div>

            <p className="mt-8 border-t border-border pt-4 text-xs text-faint">
              Sem acesso? Fale com o administrador da sua revenda.
            </p>
          </div>
        </div>

        <footer className="label-instrument text-faint">Plataforma de revendas</footer>
      </div>

      {/* ------------------------------------------------ painel visual */}
      <aside
        data-theme-transition
        className="relative hidden overflow-hidden border-l border-border bg-surface lg:block"
      >
        <InstrumentPanel className="absolute -right-24 top-1/2 h-[820px] w-[820px] -translate-y-1/2" />

        <div className="relative flex h-full flex-col justify-between p-10">
          <Wordmark className="text-lg" />

          <div className="max-w-sm">
            <p className="label-instrument text-accent-text">Cockpit</p>
            <p className="mt-3 font-display text-[26px] leading-[1.15] text-text">
              O painel de quem vende carro.
            </p>
            <p className="mt-3 text-[13px] leading-relaxed text-muted">
              Estoque, fotos, leads e o site da revenda no mesmo lugar — feito para uso diário, não
              para demonstração.
            </p>
          </div>

          <dl className="grid grid-cols-3 gap-6 border-t border-border pt-6">
            {[
              { label: "Estoque", value: "Ilimitado" },
              { label: "Site próprio", value: "Incluso" },
              { label: "Leads", value: "Centralizados" },
            ].map((item) => (
              <div key={item.label}>
                <dt className="label-instrument text-faint">{item.label}</dt>
                <dd className="mt-1 font-display text-[13px] font-medium text-text">
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </aside>
    </main>
  );
}
