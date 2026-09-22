import { Alert } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyButton } from "@/components/ui/copy-button";
import { publicEndpoints } from "@/lib/public-endpoints";
import { describeOrigin } from "@/lib/seo/urls";

/**
 * Os endereços deste app que estão cadastrados em serviços de fora.
 *
 * É a tela da troca de domínio. O plano é sair de `projetoauto.webflow.io`
 * para `vendas.carbud.com.br` (ou `crm.carbud.com.br`); quando isso
 * acontecer, `APP_ORIGIN` muda e esta lista muda junto — e cada linha
 * precisa ser recadastrada onde a coluna "onde" diz. Sem a lista, a pessoa
 * descobriria o esquecido pelo sintoma: OAuth voltando para o domínio antigo,
 * cobrança sem webhook, rotina diária em 404.
 */
export async function PublicEndpoints() {
  const info = await describeOrigin();
  const endpoints = publicEndpoints(info.origin);

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Endereços públicos</CardTitle>
        <CardDescription>
          O que está cadastrado fora do app e precisa ser atualizado quando o domínio mudar.
          Origem atual: <code className="text-xs text-text">{info.origin}</code>
          {info.source === "env" ? " (fixada por APP_ORIGIN)" : " (lida do request)"}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {info.internalHost ? (
          <Alert tone="danger">
            APP_ORIGIN não está definida e o request chega pelo host interno do Webflow Cloud.
            Os endereços abaixo estão ERRADOS — defina APP_ORIGIN nas Secret Variables com o
            domínio público (hoje <code>https://projetoauto.webflow.io</code>; depois
            <code> https://vendas.carbud.com.br</code>).
          </Alert>
        ) : info.source === "headers" ? (
          <Alert tone="warning">
            APP_ORIGIN não está definida: a origem está vindo do request. Funciona em
            desenvolvimento; em produção, fixe a variável para os links de e-mail e o OAuth
            não dependerem de proxy.
          </Alert>
        ) : null}

        <ul className="divide-y divide-border">
          {endpoints.map((endpoint) => (
            <li key={endpoint.url} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-text">{endpoint.label}</p>
                <p className="text-xs text-faint">{endpoint.where}</p>
                <code className="mt-1 block break-all text-xs text-muted">{endpoint.url}</code>
              </div>
              <CopyButton value={endpoint.url} />
            </li>
          ))}
        </ul>

        <p className="text-xs text-faint">
          Ao trocar o domínio, na ordem: APP_ORIGIN nas Secret Variables → publicar → recadastrar
          cada endereço acima → PANEL_URL na Vercel → OPS_BASE_URL no GitHub. O README tem o
          checklist completo.
        </p>
      </CardContent>
    </Card>
  );
}
