import type { Metadata } from "next";
import Link from "next/link";
import { AuthScreen } from "@/components/layout/auth-screen";
import { ResetPasswordForm } from "./reset-form";

export const metadata: Metadata = {
  title: "Redefinir senha",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <AuthScreen
        eyebrow="Recuperar acesso"
        title="Link incompleto"
        description="Este endereço não traz o código de redefinição. Peça um link novo."
      >
        <Link href="/esqueci-senha">
          <span className="inline-flex h-10 items-center rounded bg-accent px-4 text-sm font-medium text-accent-contrast">
            Pedir novo link
          </span>
        </Link>
      </AuthScreen>
    );
  }

  return (
    <AuthScreen
      eyebrow="Recuperar acesso"
      title="Escolha uma nova senha"
      description="O link vale por 1 hora e só pode ser usado uma vez."
    >
      <ResetPasswordForm token={token} />
    </AuthScreen>
  );
}
