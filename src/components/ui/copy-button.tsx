"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

/** Copia um texto e confirma no próprio botão por um instante. */
export function CopyButton({ value, label = "Copiar" }: { value: string; label?: string }) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Não consegui copiar", "Selecione o texto e copie manualmente.");
    }
  }

  return (
    <Button type="button" size="sm" variant="ghost" onClick={copy} aria-label={label}>
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copiado" : label}
    </Button>
  );
}
