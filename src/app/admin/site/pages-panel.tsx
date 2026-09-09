"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField, Input, Select, Textarea } from "@/components/ui/field";
import { IntegerInput } from "@/components/ui/number-field";
import { useToast } from "@/components/ui/toast";
import { apiPatch } from "@/lib/client/api";

/** "24, 36, x, 48" -> [24, 36, 48]. Sem repetir e em ordem. */
function parseTerms(text: string): number[] {
  const meses = text
    .split(",")
    .map((parte) => Number(parte.replace(/\D/g, "")))
    .filter((mes) => mes > 0 && mes <= 120);
  return [...new Set(meses)].sort((a, b) => a - b);
}

export type PagesValues = {
  stats: { value: string; label: string }[];
  reviews: { rating: number; text: string; author: string }[];
  downPaymentPercent: number;
  terms: number[];
  legalPrivacy: string;
  legalTerms: string;
};

/** As páginas que o desenho oferece, e o que cada uma precisa da revenda. */
export function PagesPanel({
  initial,
  readOnly,
  hasFinancing,
}: {
  initial: PagesValues;
  readOnly?: boolean;
  /** O template escolhido implementa a página? Sem ela, o campo não faz nada. */
  hasFinancing: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [values, setValues] = useState(initial);
  const [saving, setSaving] = useState(false);
  /**
   * Os prazos guardam o TEXTO enquanto a pessoa digita.
   *
   * Reconstruir o campo a partir da lista a cada tecla apaga o que ela acabou
   * de escrever: ao digitar "24, 3" a vírgula e o espaço viram uma parte
   * vazia, somem na reformatação, e o cursor pula. A lista só é derivada ao
   * sair do campo e ao salvar, que é quando ela precisa estar certa.
   */
  const [termsText, setTermsText] = useState(initial.terms.join(", "));

  function update<K extends keyof PagesValues>(key: K, value: PagesValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);

    const result = await apiPatch("/api/admin/site", {
      // linha vazia não vai para o banco: ela viraria uma coluna em branco na
      // faixa do site, que é pior que a faixa não existir
      stats: values.stats.filter((stat) => stat.value.trim() && stat.label.trim()),
      // depoimento sem texto vira card vazio no site; some antes de salvar
      reviews: values.reviews
        .filter((review) => review.text.trim())
        .map((review) => ({
          rating: review.rating,
          text: review.text.trim(),
          author: review.author.trim(),
        })),
      financing: {
        downPaymentPercent: values.downPaymentPercent,
        terms: parseTerms(termsText),
      },
      legalPrivacy: values.legalPrivacy,
      legalTerms: values.legalTerms,
    });

    setSaving(false);
    if (!result.ok) {
      toast.error("Não consegui salvar", result.error);
      return;
    }
    toast.success("Páginas atualizadas");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      {/* ------------------------------------------------------- números */}
      <Card>
        <CardHeader>
          <CardTitle>Números da loja</CardTitle>
          <CardDescription>
            Aparecem numa faixa na home e no Sobre. São até três, e o texto é livre — o
            {" "}
            <span className="font-medium text-text">+300</span>, o{" "}
            <span className="font-medium text-text">4,9/5</span> e o{" "}
            <span className="font-medium text-text">10 anos</span> convivem na mesma linha. Deixe
            em branco para esconder a faixa.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {values.stats.map((stat, index) => (
            <div key={index} className="mb-3 grid gap-3 sm:grid-cols-[1fr_2fr_auto]">
              <Input
                aria-label={`Número ${index + 1}`}
                placeholder="+300"
                disabled={readOnly}
                value={stat.value}
                onChange={(event) => {
                  const next = [...values.stats];
                  next[index] = { ...stat, value: event.target.value };
                  update("stats", next);
                }}
              />
              <Input
                aria-label={`Descrição do número ${index + 1}`}
                placeholder="veículos vendidos"
                disabled={readOnly}
                value={stat.label}
                onChange={(event) => {
                  const next = [...values.stats];
                  next[index] = { ...stat, label: event.target.value };
                  update("stats", next);
                }}
              />
              {!readOnly ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label={`Remover número ${index + 1}`}
                  onClick={() =>
                    update(
                      "stats",
                      values.stats.filter((_, position) => position !== index),
                    )
                  }
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              ) : null}
            </div>
          ))}

          {!readOnly && values.stats.length < 3 ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => update("stats", [...values.stats, { value: "", label: "" }])}
            >
              <Plus className="h-3.5 w-3.5" />
              Adicionar número
            </Button>
          ) : null}
        </CardContent>
      </Card>

      {/* ---------------------------------------------------- avaliações */}
      <Card>
        <CardHeader>
          <CardTitle>Avaliações de clientes</CardTitle>
          <CardDescription>
            Aparecem na página Sobre nós. São depoimentos que você cadastra — não vêm do Google
            nem de outro site. Sem nenhum cadastrado, a seção não aparece: um espaço reservado
            vazio trabalha contra a loja.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {values.reviews.map((review, index) => (
            <div
              key={index}
              className="mb-3 rounded-inner border border-border px-4 py-3"
            >
              <div className="mb-2 flex items-center justify-between gap-3">
                <Select
                  aria-label={`Nota do depoimento ${index + 1}`}
                  disabled={readOnly}
                  className="max-w-[10rem]"
                  value={String(review.rating)}
                  onChange={(event) => {
                    const next = [...values.reviews];
                    next[index] = { ...review, rating: Number(event.target.value) };
                    update("reviews", next);
                  }}
                >
                  {[5, 4, 3, 2, 1].map((nota) => (
                    <option key={nota} value={nota}>
                      {"★".repeat(nota)} {nota}
                    </option>
                  ))}
                </Select>

                {!readOnly ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    aria-label={`Remover depoimento ${index + 1}`}
                    onClick={() =>
                      update(
                        "reviews",
                        values.reviews.filter((_, posicao) => posicao !== index),
                      )
                    }
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                ) : null}
              </div>

              <Textarea
                aria-label={`Texto do depoimento ${index + 1}`}
                rows={2}
                disabled={readOnly}
                placeholder="Atendimento rápido e negociação clara do começo ao fim."
                value={review.text}
                onChange={(event) => {
                  const next = [...values.reviews];
                  next[index] = { ...review, text: event.target.value };
                  update("reviews", next);
                }}
              />

              <Input
                aria-label={`Autor do depoimento ${index + 1}`}
                className="mt-2"
                disabled={readOnly}
                placeholder="Nome do cliente (opcional)"
                value={review.author}
                onChange={(event) => {
                  const next = [...values.reviews];
                  next[index] = { ...review, author: event.target.value };
                  update("reviews", next);
                }}
              />
            </div>
          ))}

          {!readOnly && values.reviews.length < 6 ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() =>
                update("reviews", [...values.reviews, { rating: 5, text: "", author: "" }])
              }
            >
              <Plus className="h-3.5 w-3.5" />
              Adicionar depoimento
            </Button>
          ) : null}
        </CardContent>
      </Card>

      {/* -------------------------------------------------- financiamento */}
      <Card>
        <CardHeader>
          <CardTitle>Simulação de financiamento</CardTitle>
          <CardDescription>
            O site mostra apenas quanto sobra para financiar — nunca o valor da parcela, que
            depende da análise do banco. Cada simulação enviada vira uma proposta em rascunho em
            Financiamentos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!hasFinancing ? (
            <Alert tone="info" className="mb-4">
              O template escolhido não tem página de financiamento. Estes valores ficam guardados
              e passam a valer se você trocar para um template que tenha.
            </Alert>
          ) : null}

          <div className="grid gap-x-4 sm:grid-cols-2">
            <FormField
              label="Entrada sugerida (%)"
              htmlFor="down-percent"
              hint="Preenche o campo antes de a pessoa digitar o valor dela"
            >
              <IntegerInput
                id="down-percent"
                disabled={readOnly}
                value={values.downPaymentPercent}
                onChangeNumber={(next) => update("downPaymentPercent", Math.min(next, 90))}
              />
            </FormField>

            <FormField
              label="Prazos oferecidos"
              htmlFor="terms"
              hint="Em meses, separados por vírgula"
            >
              <Input
                id="terms"
                disabled={readOnly}
                value={termsText}
                onChange={(event) => setTermsText(event.target.value)}
                onBlur={() => setTermsText(parseTerms(termsText).join(", "))}
              />
            </FormField>
          </div>
        </CardContent>
      </Card>

      {/* -------------------------------------------------------- legais */}
      <Card>
        <CardHeader>
          <CardTitle>Privacidade e termos</CardTitle>
          <CardDescription>
            São textos da sua empresa, não nossos — quem responde por eles é a loja. Enquanto
            estiverem vazios, a página não existe e o link some do rodapé, em vez de levar a uma
            página em branco.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormField
            label="Política de Privacidade"
            htmlFor="legal-privacy"
            hint="Como os dados enviados pelo site são tratados"
          >
            <Textarea
              id="legal-privacy"
              rows={8}
              disabled={readOnly}
              value={values.legalPrivacy}
              onChange={(event) => update("legalPrivacy", event.target.value)}
            />
          </FormField>

          <FormField
            label="Termos de Uso"
            htmlFor="legal-terms"
            hint="Condições de uso do site"
            className="mb-0"
          >
            <Textarea
              id="legal-terms"
              rows={8}
              disabled={readOnly}
              value={values.legalTerms}
              onChange={(event) => update("legalTerms", event.target.value)}
            />
          </FormField>
        </CardContent>
      </Card>

      {!readOnly ? (
        <div className="sticky bottom-4 flex justify-end">
          <Button type="button" loading={saving} onClick={handleSave}>
            Salvar
          </Button>
        </div>
      ) : null}
    </div>
  );
}
