# Sites das revendas

O app que a Vercel serve. Cada revenda tem o dominio dela, e este app descobre
de quem e o site pelo `Host` da requisicao.

Ele **nao tem banco**. O D1 e um binding do Cloudflare e vive no painel; aqui
tudo vem da API publica (`/api/public/...`). Se algum dia aparecer um import de
Drizzle nesta pasta, o desenho saiu do lugar.

Os templates sao os mesmos do painel, vindos de `@projetoauto/site-kit`. Nao
existe copia — uma correcao de template chega aos dois lugares no mesmo commit.

## Rodar localmente

O painel precisa estar de pe (`npm run dev` na raiz, porta 3000).

    cp sites/.env.example sites/.env.local   # e preencha
    npm run dev:sites                        # porta 3100

Como `localhost:3100` nao e dominio de revenda nenhuma, use
`FALLBACK_TENANT_SLUG` para escolher qual loja abrir.

## Variaveis

| Variavel | Para que |
|---|---|
| `PANEL_URL` | endereco do painel; sem ela o build falha de proposito |
| `SITES_API_KEY` | mesma chave do painel, quando ele exigir uma |
| `FALLBACK_TENANT_SLUG` | so em desenvolvimento e na primeira publicacao |

## Na Vercel

Um projeto so para todas as revendas, com **Root Directory** em `sites`. Os
dominios sao adicionados pelo painel, na aba de dominios da revenda — ninguem
entra na Vercel para isso.
