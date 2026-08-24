import type { Metadata } from "next";
import { LogoutButton } from "@/components/layout/logout-button";
import { requirePageAuth } from "@/lib/auth/guards";
import { defaultLandingPath } from "@/lib/auth/session";
import { ChangePasswordForm } from "./change-password-form";

export const metadata: Metadata = { title: "Trocar senha", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function ChangePasswordPage() {
  const context = await requirePageAuth();
  const redirectTo = defaultLandingPath(context.role);
  const provisional = context.user.mustChangePassword;

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-4 py-12">
      <div className="w-full max-w-[380px]">
        <div className="rounded border border-border bg-surface p-6">
          <p className="label-instrument text-accent-text">
            {provisional ? "Primeiro acesso" : "Segurança"}
          </p>
          <h1 className="mt-2 text-[20px] leading-tight text-text">
            {provisional ? "Defina sua senha" : "Trocar senha"}
          </h1>
          <p className="mt-1.5 text-[13px] text-muted">
            {provisional
              ? "Sua senha atual é provisória. Escolha uma nova para continuar."
              : "As outras sessões abertas serão encerradas."}
          </p>

          <div className="mt-6">
            <ChangePasswordForm redirectTo={redirectTo} />
          </div>
        </div>

        <div className="mt-4 flex justify-center">
          <LogoutButton />
        </div>
      </div>
    </main>
  );
}
