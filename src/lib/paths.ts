/**
 * Ponte para o pacote compartilhado.
 *
 * A resolucao do basePath mudou de casa porque os templates precisam dela e o
 * app dos sites nao enxerga `src/`. Os arquivos do painel continuam importando
 * `@/lib/paths` — trocar 9 imports para ganhar nada seria ruido no historico.
 */
export { withBasePath, BASE_PATH, apiUrl, mediaUrl } from "@projetoauto/site-kit/paths";
