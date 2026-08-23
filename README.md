# Plataforma SaaS para Revendas de Veículos

Plataforma multi-tenant onde cada revenda de veículos ganha um painel de gestão e um
site público de estoque, tudo administrado por um painel geral (super-admin).

Deploy 100% em **Webflow Cloud** (Next.js + adapter OpenNext → Cloudflare Workers).

## Arquitetura

| Área | Rota | Quem usa |
|---|---|---|
| Painel Geral | `/super-admin` | Equipe interna (super-admin) |
| Painel da Revenda | `/admin` | Dono, vendedores e visualizadores da revenda |
| Site público | `/r/[slug]` | Clientes finais da revenda |
| Rotas operacionais | `/api/ops/*` | Migrations e bootstrap (protegidas por segredo) |

O app é montado num **mount path** do site Webflow (ex.: `autofodase.com/app`). O `basePath`
vem de `BASE_URL`/`NEXT_PUBLIC_BASE_PATH` — nunca hardcode caminho absoluto.

### Restrições do runtime respeitadas

- Sem APIs exclusivas de Node: senha com **PBKDF2 (Web Crypto)**, nada de `bcrypt`/`sharp`.
- Bindings (`DB`, `CACHE`, `MEDIA`) acessados só dentro de handlers, via `getCloudflareContext()`
  (ver [src/lib/cloudflare.ts](src/lib/cloudflare.ts)).
- Middleware Edge faz apenas verificação criptográfica do JWT — não consulta o banco.
- Sem dependência de ISR/revalidação on-demand: as páginas são SSR com cache leve no KV.
- Bucket R2 é privado: imagens são servidas por route handler (`/api/media/...`).
- Tenancy por path, isolada em [src/lib/tenant/resolveTenant.ts](src/lib/tenant/resolveTenant.ts)
  para permitir migrar a subdomínio/domínio custom sem reescrever o app.

## Stack

Next.js 15 (App Router) · TypeScript · Tailwind v4 · Drizzle ORM (D1/SQLite) · Zod · jose (JWT)

## Rodando localmente

```bash
npm install
cp .dev.vars.example .dev.vars      # preencha AUTH_SECRET e OPS_SECRET
npm run preview                      # build OpenNext + wrangler dev (runtime real do Workers)
```

O servidor sobe em `http://127.0.0.1:8787` com D1, KV e R2 locais em `.wrangler/`.

> `npm run dev` (Next puro) é mais rápido para mexer em UI, mas só o `npm run preview`
> reproduz o runtime do Webflow Cloud. Valide sempre no preview antes de commitar.

### Primeira execução

```bash
SECRET="<valor de OPS_SECRET>"

# 1. aplica as migrations
curl -X POST http://127.0.0.1:8787/api/ops/migrate -H "x-ops-secret: $SECRET"

# 2. cria o primeiro super-admin + popula o catálogo de marcas/modelos
curl -X POST http://127.0.0.1:8787/api/ops/bootstrap \
  -H "x-ops-secret: $SECRET" -H "content-type: application/json" \
  -d '{"email":"voce@empresa.com","name":"Seu Nome","password":"suaSenhaForte"}'
```

Depois acesse `http://127.0.0.1:8787/login`.

## Banco de dados

```bash
npm run db:generate     # gera a migration a partir do schema Drizzle
npm run db:bundle       # embute as migrations no bundle (roda sozinho no build)
```

As migrations do Drizzle ficam em `drizzle/` e são **aditivas** — nunca edite um arquivo
já aplicado em produção; gere uma nova migration.

Como o Workers não tem acesso a filesystem, `scripts/bundle-migrations.mjs` transforma os
`.sql` em `src/db/migrations.generated.ts`, e a rota `/api/ops/migrate` aplica o que falta
no banco do ambiente (local ou Webflow Cloud), controlando o que já rodou em `_app_migrations`.

## Variáveis de ambiente (Webflow Cloud)

| Nome | Tipo | Descrição |
|---|---|---|
| `AUTH_SECRET` | Secret | Chave HS256 que assina os JWT de sessão |
| `OPS_SECRET` | Secret | Protege `/api/ops/*` |
| `NEXT_PUBLIC_BASE_PATH` | Variable | Mount path do app (ex.: `/app`) |

## Deploy

Push na `main` dispara o deploy automático no Webflow Cloud. Após o primeiro deploy, rode
`/api/ops/migrate` apontando para o domínio de produção para criar as tabelas.
