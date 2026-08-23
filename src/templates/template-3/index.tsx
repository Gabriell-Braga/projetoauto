/**
 * SLOT DO TEMPLATE 3 — aguardando design final.
 *
 * Como implementar:
 * 1. Copie a estrutura de `src/templates/template-1-clean/index.tsx`
 *    (ou de `template-2-dark` se o design for escuro).
 * 2. Implemente Home, Listing, VehicleDetail e Contact recebendo exatamente
 *    os props de `src/templates/contract.ts`. Nenhum acesso a banco aqui.
 * 3. Use `var(--site-primary)`, `var(--site-accent)`, `var(--site-surface)`,
 *    `var(--site-font-heading)` e `var(--site-font-body)` — nunca cor fixa,
 *    senão a customização da revenda não funciona.
 * 4. Marque `status: "ready"` no manifesto em `src/templates/manifests.ts`
 *    para o template aparecer como selecionável nos painéis.
 *
 * Enquanto isso, este slot reaproveita o template Clean para que qualquer
 * revenda apontada para ele continue com o site no ar.
 */
import fallback from "@/templates/template-1-clean";
import type { TemplateModule } from "@/templates/contract";

const template: TemplateModule = fallback;
export default template;
