import { Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Recurso fora do plano.
 *
 * Diz o que a funcionalidade faz, não só que ela falta: quem lê precisa
 * decidir se vale contratar, e "indisponível no seu plano" não ajuda nisso.
 * Sem botão de compra — a contratação passa pela plataforma, não por
 * autoatendimento aqui dentro.
 */
export function FeatureLocked({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
        <Lock className="h-5 w-5 text-faint" />
        <p className="font-display text-[15px] font-medium text-text">{title}</p>
        <p className="max-w-md text-[13px] leading-relaxed text-muted">{description}</p>
        <p className="text-xs text-faint">Fale com o suporte para incluir no seu plano.</p>
      </CardContent>
    </Card>
  );
}
