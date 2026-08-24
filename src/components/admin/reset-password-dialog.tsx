"use client";

import { useState } from "react";
import { Copy, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Label } from "@/components/ui/field";
import { PasswordInput, PasswordRequirements } from "@/components/ui/password-input";
import { useToast } from "@/components/ui/toast";
import {
  firstPasswordIssue,
  generateCompliantPassword,
  isPasswordStrong,
} from "@/lib/auth/password-policy";

/**
 * Substitui o `window.prompt` que era usado para redefinir senha de terceiros.
 * O prompt do navegador mostrava a senha em texto puro, não validava nada e
 * não dizia o que estava errado quando a API recusava.
 */
export function ResetPasswordDialog({
  open,
  onClose,
  userLabel,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  userLabel: string;
  onConfirm: (password: string) => Promise<boolean>;
}) {
  const toast = useToast();
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState(false);

  const issue = touched ? firstPasswordIssue(password) : null;
  const valid = isPasswordStrong(password);

  function close() {
    setPassword("");
    setTouched(false);
    onClose();
  }

  function generate() {
    const generated = generateCompliantPassword();
    setPassword(generated);
    setTouched(true);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(password);
      toast.success("Senha copiada.", "Envie para a pessoa por um canal seguro.");
    } catch {
      toast.error("Não foi possível copiar", "Selecione o texto e copie manualmente.");
    }
  }

  async function confirm() {
    setTouched(true);
    if (!valid) return;

    setSaving(true);
    const ok = await onConfirm(password);
    setSaving(false);
    if (ok) close();
  }

  return (
    <Dialog
      open={open}
      onClose={close}
      title="Redefinir senha"
      description={`Nova senha provisória para ${userLabel}. A pessoa será obrigada a trocá-la no primeiro acesso e as sessões abertas dela serão encerradas.`}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={close}>
            Cancelar
          </Button>
          <Button type="button" loading={saving} disabled={touched && !valid} onClick={confirm}>
            Redefinir senha
          </Button>
        </>
      }
    >
      <Label htmlFor="reset-password">Nova senha provisória</Label>
      <PasswordInput
        id="reset-password"
        value={password}
        autoComplete="new-password"
        aria-invalid={issue ? true : undefined}
        onChange={(event) => {
          setPassword(event.target.value);
          setTouched(true);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            void confirm();
          }
        }}
      />

      {issue ? (
        <p role="alert" className="mt-1.5 text-xs text-danger">
          {issue}
        </p>
      ) : null}

      <PasswordRequirements value={password} />

      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="secondary" onClick={generate}>
          <RefreshCw className="h-3.5 w-3.5" />
          Gerar senha
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={!password}
          onClick={copy}
        >
          <Copy className="h-3.5 w-3.5" />
          Copiar
        </Button>
      </div>
    </Dialog>
  );
}
