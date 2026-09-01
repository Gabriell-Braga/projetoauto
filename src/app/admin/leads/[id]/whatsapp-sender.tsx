"use client";

import { useMemo, useState } from "react";
import { MessageCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField, Select, Textarea } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { apiPost } from "@/lib/client/api";
import {
  firstName,
  renderTemplate,
  whatsappLink,
  type TemplateContext,
} from "@/lib/integrations/message-templates";

export type Template = { id: string; name: string; body: string; active: boolean };

/**
 * Envio de WhatsApp a partir de um modelo.
 *
 * Abre o aplicativo com a mensagem já escrita, via wa.me — funciona sem
 * contrato, sem API oficial e em qualquer aparelho. O que muda quando existir
 * a API é só o transporte: o modelo e o registro continuam os mesmos.
 *
 * O texto fica editável antes de sair. Modelo é ponto de partida, e obrigar a
 * mandar exatamente o que está escrito faria o vendedor abandonar o recurso e
 * digitar tudo no celular, fora do sistema.
 */
export function WhatsappSender({
  leadId,
  phone,
  templates,
  context,
  onSent,
}: {
  leadId: string;
  phone: string;
  templates: Template[];
  context: TemplateContext;
  onSent: () => void;
}) {
  const toast = useToast();
  const active = templates.filter((template) => template.active);
  const [templateId, setTemplateId] = useState(active[0]?.id ?? "");
  const [edited, setEdited] = useState<string | null>(null);
  const [registering, setRegistering] = useState(false);

  const rendered = useMemo(() => {
    const template = active.find((item) => item.id === templateId);
    if (!template) return "";
    return renderTemplate(template.body, {
      ...context,
      primeiro_nome: context.nome ? firstName(context.nome) : null,
    });
  }, [active, templateId, context]);

  const message = edited ?? rendered;

  async function handleSend() {
    if (!message.trim()) {
      toast.error("Escreva a mensagem antes de enviar");
      return;
    }

    // abre o WhatsApp primeiro: se o registro falhar, a conversa acontece
    // do mesmo jeito — o histórico é importante, mas não mais que a venda
    window.open(whatsappLink(phone, message), "_blank", "noopener");

    setRegistering(true);
    const result = await apiPost(`/api/admin/leads/${leadId}/events`, {
      type: "whatsapp",
      body: message,
    });
    setRegistering(false);

    if (!result.ok) {
      toast.error("WhatsApp aberto, mas não registrei no histórico", result.error);
      return;
    }
    toast.success("WhatsApp aberto e registrado no histórico");
    setEdited(null);
    onSent();
  }

  if (active.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>WhatsApp</CardTitle>
          <CardDescription>
            Nenhum modelo de mensagem ativo. Crie um em Configuração → Mensagens.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Enviar WhatsApp</CardTitle>
        <CardDescription>
          Escolha um modelo, ajuste o que quiser e envie. Fica registrado no histórico.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FormField label="Modelo" htmlFor="wa-template">
          <Select
            id="wa-template"
            value={templateId}
            onChange={(event) => {
              setTemplateId(event.target.value);
              setEdited(null);
            }}
          >
            {active.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Mensagem" htmlFor="wa-message" className="mb-3">
          <Textarea
            id="wa-message"
            rows={4}
            value={message}
            onChange={(event) => setEdited(event.target.value)}
          />
        </FormField>

        <div className="flex flex-wrap items-center justify-between gap-2">
          {edited !== null ? (
            <button
              type="button"
              onClick={() => setEdited(null)}
              className="text-xs text-muted underline-offset-2 hover:text-text hover:underline"
            >
              Voltar ao modelo
            </button>
          ) : (
            <span className="text-xs text-faint">
              <MessageCircle className="mr-1 inline h-3 w-3" />
              abre no seu WhatsApp
            </span>
          )}

          <Button type="button" loading={registering} onClick={handleSend}>
            <Send className="h-3.5 w-3.5" />
            Abrir e registrar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
