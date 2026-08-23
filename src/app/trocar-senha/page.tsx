import type { Metadata } from "next";
import { LogoutButton } from "@/components/layout/logout-button";
import { requirePageAuth } from "@/lib/auth/guards";
import { defaultLandingPath } from "@/lib/auth/session";
import { ChangePasswordForm } from "./change-password-form";

export const metadata: Metadata = { title: "Trocar senha" };
export const dynamic = "force-dynamic";

export default async function ChangePasswordPage() {
  const context = await requirePageAuth();
  const redirectTo = defaultLandingPath(context.role);

  return (
    <main className="flex min-h-screen items-center justify-center bg-ink-100 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold text-ink-900">
            {context.user.mustChangePassword ? "Defina sua senha" : "Trocar senha"}
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            {context.user.mustChangePassword
              ? "Sua senha é provisória. Escolha uma nova para continuar."
              : "Ao trocar, as outras sessões abertas são encerradas."}
          </p>
        </div>

        <div className="rounded-xl border border-ink-200 bg-white p-6 shadow-sm">
          <ChangePasswordForm redirectTo={redirectTo} />
        </div>

        <div className="mx-auto mt-6 w-40 rounded-lg bg-ink-950 px-2 py-1">
          <LogoutButton />
        </div>
      </div>
    </main>
  );
}
