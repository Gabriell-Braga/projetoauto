import { asaasEnvironment, listWebhooks, WEBHOOK_EVENTS } from "@/lib/gateway/asaas";
import { jsonOk, withApi } from "@/lib/http";
import { assertOpsSecret } from "@/lib/ops";
import { getPlatformSettings } from "@/lib/plans/service";

export const dynamic = "force-dynamic";

/**
 * Diagnóstico da integração — somente leitura.
 *
 * Existe para conferir a configuração sem ninguém precisar expor chave nem
 * token: reporta apenas se cada segredo ESTÁ presente, nunca o valor.
 */
export const GET = withApi(async (request: Request) => {
  assertOpsSecret(request);

  const apiKeyPresent = Boolean(process.env.ASAAS_API_KEY);
  const webhookTokenPresent = Boolean(process.env.ASAAS_WEBHOOK_TOKEN);

  const report: Record<string, unknown> = {
    segredos: {
      ASAAS_API_KEY: apiKeyPresent ? "configurado" : "AUSENTE",
      ASAAS_WEBHOOK_TOKEN: webhookTokenPresent ? "configurado" : "AUSENTE",
    },
  };

  if (!apiKeyPresent) {
    report.proximoPasso = "Cadastrar ASAAS_API_KEY nas Secret Variables e refazer o deploy.";
    return jsonOk(report);
  }

  report.ambiente = asaasEnvironment();
  report.configuracoes = await getPlatformSettings();

  // a chamada real prova que a chave funciona e que o IP não está bloqueado
  try {
    const { data } = await listWebhooks();
    report.conexao = "ok";
    report.webhooks = data.map((hook) => ({
      id: hook.id,
      nome: hook.name,
      url: hook.url,
      ativo: hook.enabled,
    }));

    const esperado = `/api/webhooks/asaas`;
    const nosso = data.find((hook) => hook.url?.includes(esperado));
    report.diagnostico = !nosso
      ? "Nenhum webhook aponta para /api/webhooks/asaas."
      : nosso.enabled
        ? "Webhook apontando para cá e ATIVO."
        : "Webhook apontando para cá, mas DESLIGADO — falta ligar no painel do Asaas.";
    report.eventosEsperados = WEBHOOK_EVENTS;
  } catch (error) {
    report.conexao = "falhou";
    report.erro = error instanceof Error ? error.message : String(error);
    report.diagnostico =
      "A chave não autenticou ou a conta bloqueia o IP de saída. Rodamos em Cloudflare Workers, com IP dinâmico.";
  }

  return jsonOk(report);
});
