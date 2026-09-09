"use client";

import { useSyncExternalStore } from "react";

/**
 * O veiculo escolhido no simulador, visivel para o formulario de lead.
 *
 * Os dois vivem na MESMA pagina mas em ramos diferentes da arvore: o template
 * recebe cada um como um no pronto e os coloca em lugares distintos. Nao ha
 * ancestral comum onde pendurar um contexto sem obrigar toda pagina a
 * embrulhar os dois.
 *
 * Sem isto, quem abria a pagina de financiamento pela navegacao, olhava a
 * parcela do carro que ja vinha selecionado e enviava o formulario mandava um
 * lead SEM veiculo nenhum. A loja recebia "quero financiar" e nada mais.
 *
 * E uma variavel de modulo de proposito: no navegador ela vive enquanto a
 * pagina viver, e no servidor o snapshot e fixo, entao render de um visitante
 * nunca enxerga a escolha de outro.
 */
let selecionado: string | null = null;
const ouvintes = new Set<() => void>();

export function setSelectedVehicleLabel(label: string | null): void {
  if (selecionado === label) return;
  selecionado = label;
  for (const ouvinte of ouvintes) ouvinte();
}

function subscribe(ouvinte: () => void): () => void {
  ouvintes.add(ouvinte);
  return () => {
    ouvintes.delete(ouvinte);
  };
}

const getSnapshot = () => selecionado;

/** No servidor sempre `null`: a escolha so existe depois de a pagina abrir. */
const getServerSnapshot = () => null;

export function useSelectedVehicleLabel(): string | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
