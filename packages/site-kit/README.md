# @projetoauto/site-kit

Os templates dos sites das revendas e o pouco de codigo que eles precisam.

Existe por uma restricao da Vercel: um projeto com **Root Directory** apontando
para uma subpasta nao consegue importar arquivos fora dela — `..` e recusado.
Como o painel (Webflow Cloud, na raiz) e o app dos sites (`sites/`, na Vercel)
renderizam os MESMOS templates, o codigo compartilhado precisa ser um pacote de
workspace, que o npm liga dentro de `node_modules` dos dois.

O que entra aqui: o que os dois apps usam para desenhar um site publico.
O que NAO entra: qualquer coisa de painel — banco, autenticacao, cobranca,
leads do lado de dentro. O pacote nao sabe que existe um painel.

## Entradas

| Entrada | Serve para |
|---|---|
| `@projetoauto/site-kit` | templates, contrato, registro de temas |
| `@projetoauto/site-kit/catalog` | cambio/combustivel/carroceria: valores e rotulos |
| `@projetoauto/site-kit/format` | `cn`, moeda e numero em pt-BR |
| `@projetoauto/site-kit/paths` | basePath (o painel roda sob um mount path) |
| `@projetoauto/site-kit/client-api` | `fetch` dos formularios |

`catalog` e separado de proposito: o schema do banco importa os valores dele, e
puxar a barra principal traria componente React para dentro do Worker.
