"use client";

import { useConfirm } from "@/components/ui/confirm";

/**
 * Confirmação antes de publicar mudança do site.
 *
 * O site é público e não tem rascunho: o que se salva aqui aparece para quem
 * estiver no site no minuto seguinte. Sem uma parada no caminho, um campo
 * apagado sem querer vira uma página errada no ar, e ninguém percebe até um
 * cliente perguntar.
 *
 * A confirmação diz O QUE vai ao ar, e não só "tem certeza?". Diálogo que não
 * informa nada é só um clique a mais, e ensina a pessoa a apertar "sim" sem
 * ler — que é pior do que não ter diálogo nenhum.
 */
export function usePublishConfirm() {
  const confirm = useConfirm();

  return (oQue: string) =>
    confirm({
      title: "Publicar no site",
      description: `${oQue} passam a valer no site agora, para quem estiver visitando. Dá para editar de novo depois, mas não existe desfazer.`,
      confirmLabel: "Publicar agora",
      cancelLabel: "Continuar editando",
    });
}
