# Estado do projeto — 08/09/2026

Documento de passagem de bastão. Descreve **onde as coisas estão**, **por que
estão assim** e **o que falta**. Escrito para quem chega sem ter acompanhado a
conversa.

---

## 1. O que é o produto

SaaS multi-inquilino para revendas de carros no Brasil. Três frentes:

| Frente | Onde vive | Endereço |
|---|---|---|
| Painel do super-admin | Webflow Cloud | `/app/super-admin` |
| Painel da revenda | Webflow Cloud | `/app/admin` |
| Site público da revenda | Webflow Cloud (prévia) e **Vercel** (domínio próprio) | `/app/r/<slug>` e o domínio da loja |

Interface toda em pt-BR; código e identificadores em inglês.

---

## 2. Arquitetura, e as razões

### 2.1 Por que os sites das revendas não ficam no Webflow Cloud

O Webflow Cloud só serve o app em `webflow.io` ou montado sob um site Webflow
— **não dá para apontar o domínio da revenda para lá** (verificado na
documentação). Além disso, servir os sites de lá traria o selo "Made in
Webflow" para dentro do site do cliente e jogaria todo o tráfego público no
app do painel.

Por isso existe um segundo app, na Vercel, que renderiza os sites.

### 2.2 Um projeto na Vercel para todas as revendas

Decisão tomada com o usuário. Um projeto, muitos domínios — é o padrão
multi-inquilino da própria Vercel. Um projeto por revenda estouraria o limite
de projetos e multiplicaria a administração por nada.

Limites relevantes: **Hobby** = 50 domínios/projeto, 100 deploys/dia, **uso não
comercial**. **Pro** = domínios ilimitados. Hoje está no Hobby, para teste com
dados falsos; operar de verdade exige o Pro.

### 2.3 Por que os templates viraram pacote

A documentação da Vercel é explícita sobre a **Root Directory**:

> *"Your app will not be able to access files outside of that directory. You
> also cannot use `..` to move up a level"*

O app em `sites/` **não consegue** importar `../src/templates`. Como o painel e
o app dos sites desenham os mesmos templates, o código comum virou pacote de
workspace npm — o único jeito de os dois enxergarem o mesmo arquivo. A
alternativa seria duplicar os templates, e aí uma correção chegaria a um site e
não ao outro.

### 2.4 Desenho em três camadas

```
packages/site-kit/     templates + o pouco que eles usam (nao sabe que existe painel)
        |
        +-- src/       o painel (Webflow Cloud). Tem o banco.
        |
        +-- sites/     o app dos sites (Vercel). NAO tem banco.
```

`sites/` nunca fala com o banco: o D1 é binding do Cloudflare e vive no painel.
Tudo vem da API pública. **Se aparecer um `import` de Drizzle em `sites/`, o
desenho saiu do lugar.**

---

## 3. Estrutura de pastas

```
.
├── src/                      painel (Next.js -> OpenNext -> Cloudflare Workers)
│   ├── app/api/public/       a ponte para o app dos sites
│   ├── db/schema/            Drizzle
│   └── lib/integrations/     FIPE, Asaas, WhatsApp, Vercel, dominios
├── packages/site-kit/        templates compartilhados
│   └── src/
│       ├── templates/        vitrine/ (Template 01) e os antigos
│       └── lib/              catalogo, formato, links, jsonld, client-api
├── sites/                    app da Vercel (Root Directory aponta para ca)
│   └── src/{app,lib}/
└── drizzle/                  migracoes escritas a mao
```

### Entradas do pacote

| Entrada | Serve para |
|---|---|
| `@projetoauto/site-kit/contract` | tipos e `composeTheme`/`themeToCssVariables` |
| `@projetoauto/site-kit/manifests` | lista de templates |
| `@projetoauto/site-kit/registry` | `getTemplate(id)` |
| `@projetoauto/site-kit/links` | `buildSiteLinks(prefixo, whatsapp)` |
| `@projetoauto/site-kit/catalog` | câmbio/combustível/carroceria + rótulos |
| `@projetoauto/site-kit/shared/*` | formulários e GTM |
| `@projetoauto/site-kit/jsonld` | dados estruturados schema.org |

`catalog` é separado de propósito: **o schema do banco importa dele**, e puxar
a entrada principal traria componente React para dentro do Worker.

---

## 4. A API pública

Seis rotas em `src/app/api/public/`. É a **única** ponte entre os dois apps.

| Rota | Devolve |
|---|---|
| `GET /resolve?host=` | `{ slug }` — domínio → revenda |
| `GET /site/[slug]` | moldura: identidade, contato, tema, textos, `available` |
| `GET /site/[slug]/home` | destaques, novidades, facetas |
| `GET /site/[slug]/vehicles` | estoque com filtros (12 por página) |
| `GET /site/[slug]/vehicles/[vehicleSlug]` | ficha + semelhantes |
| `GET /site/[slug]/financing-options` | veículos do simulador |

**Por que `home` e `financing-options` existem separados:** a listagem não
conhece "destaque" e fixa doze por página; a regra de quem entra no simulador
também não é "o estoque". Deixar o app dos sites juntar as peças faria essas
regras existirem em dois lugares.

**Os links não vêm da API.** No painel apontam para `/r/<slug>/estoque`; no
domínio próprio, para `/estoque`. Quem monta a URL é quem sabe onde está.

### `SITES_API_KEY`

Chave inventada por nós, compartilhada entre painel e app dos sites. O conteúdo
é público de qualquer forma — **é torniquete, não segredo**: sem ela alguém
varreria o catálogo de todas as revendas em rajada às custas da cota de leitura
do D1. Limitar por IP não serve, porque todas as chamadas legítimas saem dos
endereços da Vercel. Se o painel não define a dele, as rotas ficam abertas.

---

## 5. Como as coisas atravessam a fronteira

### Fotos

O painel monta as URLs como `/app/api/media/<chave>`. O app dos sites corta na
última ocorrência de `/api/media/` e reescreve para `/media/<chave>`, que o
`rewrites()` do `next.config` encaminha ao painel na borda.

**Por que não apontar direto:** colocaria o endereço da *plataforma* dentro do
código-fonte do site do *cliente*.

### Formulários

São os mesmos componentes do painel e enviam para `/api/leads` do próprio site.
Em `sites/` isso é o domínio da revenda, então há uma rota de repasse que leva
ao painel com a chave e com o `x-forwarded-for` de quem enviou. Sem repassar o
IP, o painel veria todos os leads chegando dos endereços da Vercel.

---

## 6. Variáveis de ambiente

### Painel (`.dev.vars` local, Secret Variables no Webflow Cloud)

`AUTH_SECRET`, `OPS_SECRET`, `VAULT_KEY`, `NEXT_PUBLIC_BASE_PATH`,
`FIGMA_TOKEN`, `VERCEL_TOKEN`, `SITES_API_KEY`, e (pendente)
`VERCEL_PROJECT_ID`, `VERCEL_TEAM_ID`.

### App dos sites (`sites/.env.local` local, Environment Variables na Vercel)

| Variável | Valor |
|---|---|
| `PANEL_URL` | `https://projetoauto.webflow.io/app` — **com o mount path** |
| `SITES_API_KEY` | igual à do painel |
| `FALLBACK_TENANT_SLUG` | só em desenvolvimento e antes de existir domínio |

**`PANEL_URL` precisa do `/app`.** A raiz do `webflow.io` é o site Webflow, não
o painel. Sem o caminho, tudo cai no 404 em HTML do site — e isso derrubou a
primeira publicação.

**`FALLBACK_TENANT_SLUG` não pode ir para produção.** Com ela definida, um
domínio desconhecido apontado para o projeto renderiza a revenda do fallback em
vez de dar 404.

---

## 7. Como rodar

```bash
npm install                 # workspaces: raiz + packages/* + sites

npm run dev                 # painel, porta 3000
npm run dev:sites           # app dos sites, porta 3100 (precisa do painel de pe)

npm run typecheck           # tsc nos dois apps
npx eslint src packages sites/src --max-warnings=0
npx vitest run              # 416 testes
npm run build               # painel
npm run build:sites         # app dos sites (exige PANEL_URL)
```

**Antes de `npm run build`, derrube o servidor de dev** — ele segura o
`.next/trace` e o build morre com EPERM no Windows. E **apague o `.next` depois
do build** antes de subir o dev de novo: um `.next` de produção faz o dev
responder 500 procurando `routes-manifest.json`.

---

## 8. Estado atual

### Funciona e foi verificado

- Painel completo: super-admin, admin da revenda, veículos, leads, CRM,
  avaliações, planos, cobrança (Asaas), WhatsApp, FIPE.
- **Template 01 (Vitrine)** do Figma, oito páginas, conferido tela a tela
  contra os renders.
- Estouro horizontal no celular resolvido: `scrollWidth` = 390 px numa
  viewport de 390 px em todas as páginas.
- Extração do pacote: `tsc`, lint, 416 testes, os dois builds em 0.
- App dos sites contra o painel **local**: oito páginas em 200, home idêntica à
  do painel, foto pelo reescrito, e um lead enviado pelo formulário chegando no
  banco.
- **Na Vercel:** o build passa e o Tailwind alcança o pacote — o CSS de
  produção tem 41 KB e 29 ocorrências das classes de template. Essa era a única
  incógnita real da arquitetura de workspace.

### Não funciona ainda

`https://projetoauto-sites-seven.vercel.app/` responde **500**.

Progresso em relação ao 404 anterior: a `PANEL_URL` já está certa e a chamada
chega ao painel. A suspeita mais forte é a **seção 9.1** — `/resolve` consulta
a tabela `tenant_domains`, que a migração 0011 cria e que provavelmente não
existe no banco de produção. O erro exato está nos *runtime logs* da Vercel; o
código nomeia a causa na mensagem.

---

## 9. O que falta, em ordem

### 9.1 Migrações no banco remoto — **bloqueia o resto**

`0011` (`tenant_domains`), `0012` (stats/legal/financing) e `0013` (avaliações)
não foram aplicadas em produção. Sem a 0011 não há onde gravar domínio, e o
`/resolve` quebra.

```bash
curl -X POST https://projetoauto.webflow.io/app/api/ops/migrate \
  -H "x-ops-secret: $OPS_SECRET"
```

O runner tolera "already exists", então repetir é seguro.

### 9.2 Conferir o 500 da Vercel

Depois das migrações, recarregar. Se persistir, ler os runtime logs: as
mensagens dizem qual variável ou chamada falhou.

### 9.3 `VERCEL_PROJECT_ID` no painel

Settings → General do projeto (`prj_...`). Se a conta for **Team**, também
`VERCEL_TEAM_ID` — sem ele a API responde que o projeto não existe.

Enquanto essas variáveis não existem, a aba de domínios responde *"a hospedagem
dos sites ainda não está configurada"*. **Isso é a informação correta, não um
defeito.**

### 9.4 Fechar o ciclo do domínio

Cadastrar um domínio pelo painel → conferir que a Vercel recebeu → criar o DNS
→ verificar. Apagar `FALLBACK_TENANT_SLUG` quando o primeiro domínio real
responder.

### 9.5 Templates 02 (Showroom) e 03 (Marketplace)

A fundação compartilhada já existe, então devem andar mais rápido que o 01.
**Seguir o Figma à risca** — decisão explícita do usuário: quem desenhou é
especialista em marketing, e mudanças de desenho não são nossa alçada.

### 9.6 Pendências menores

- `OPS_SECRET` nos secrets do GitHub Actions.
- Migrar para o plano **Pro** da Vercel antes de operar comercialmente.
- **LGPD:** o formulário de financiamento coleta CPF (hoje opcional). Precisa
  de alinhamento com quem desenhou e com o jurídico. **Pergunta aberta, nunca
  respondida.**

---

## 10. Segurança — regras em vigor

- A chave **de produção** do Asaas **nunca** passa pelo chat: vai direto nas
  Secret Variables.
- A chave de sandbox `$aact_hmlg_...` apareceu no histórico e **deve ser
  rotacionada** antes de produção.
- `AUTH_SECRET` e `OPS_SECRET` passaram pelo chat no início — rotacionar é
  barato e recomendado.
- `VAULT_KEY` foi gerada direto no `.dev.vars` e nunca passou pelo chat.
- `FIGMA_TOKEN`, `VERCEL_TOKEN`, `SITES_API_KEY`: só em `.dev.vars`
  (gitignored) ou Secret Variables. Lidas via `process.env`, **nunca impressas
  — inclusive em mensagem de erro.**
- O selo "Made in Webflow" **não** deve ser removido por CSS/JS: viola os
  termos do plano gratuito. O caminho certo é um Site Plan pago.

---

## 11. Armadilhas já pagas — não repetir

| Armadilha | O que acontece |
|---|---|
| `grid` sem `grid-cols-*` na base | uma trilha `auto`, mínimo = min-content, e o conteúdo empurra a página para fora da tela no celular. Use `grid-cols-1`. |
| `1fr` dentro de `grid-cols-[...]` | é `minmax(auto,1fr)`; use `minmax(0,1fr)`. |
| Tailwind v4 e `node_modules` | a varredura pula `node_modules`, então os templates do pacote **não** geram classe nenhuma. `@source` resolve. Sintoma: página com todo o conteúdo certo e **nenhum estilo**, sem erro no build. |
| Tailwind v4 e cursor | o preflight não põe mais a mãozinha em `button`. Regra explícita no `globals.css`. |
| `truncate` em filho de flex | precisa de `min-w-0`, senão não trunca. |
| Chrome headless | `--window-size` **não** define a viewport. Só `Emulation.setDeviceMetricsOverride` aplicado **antes** do `Page.navigate`. |
| Heredoc com regex | as barras invertidas somem. Escrever o script com a ferramenta de escrita, não com heredoc. |
| Contador de módulo para id de componente | quebra a hidratação. Usar `useId()`. |
| Commitar antes de ler o resultado do build | já aconteceu. **Conferir o código de saída antes de commitar.** |

---

## 12. Convenções

- Comentário explica **por que**, não o que. Se o código já diz, o comentário
  sobra.
- Testes cobrem lógica pura e o caso que já quebrou de verdade.
- Mensagem de commit em prosa, dizendo a razão da mudança.
- Commitar e empurrar para `main` automaticamente, **depois** de `tsc`, lint,
  testes e build passarem.
