import type { Metadata } from "next";
import { AuthScreen } from "@/components/layout/auth-screen";
import { ForgotPasswordForm } from "./forgot-form";

export const metadata: Metadata = { title: "Esqueci minha senha", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function ForgotPasswordPage() {
  return (
    <AuthScreen
      eyebrow="Recuperar acesso"
      title="Esqueci minha senha"
      description="Informe o e-mail da conta e enviamos um link para você escolher uma nova senha."
    >
      <ForgotPasswordForm />
    </AuthScreen>
  );
}
