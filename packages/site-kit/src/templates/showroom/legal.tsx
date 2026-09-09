import Link from "next/link";
import type { LegalProps } from "../contract";
import { SHELL, Shell } from "./chrome";

/**
 * Página de texto corrido: privacidade e termos.
 *
 * Sem card e sem seção, igual ao Vitrine e pelo mesmo motivo: o conteúdo é
 * jurídico, varia de tamanho de forma imprevisível e existe para ser lido do
 * começo ao fim. Moldura decorativa só estreita a coluna.
 */
export function Legal({ site, links, title, body, updatedAt }: LegalProps) {
  return (
    <Shell site={site} links={links}>
      <article className={`${SHELL} max-w-3xl py-14`}>
        <nav className="mb-6 text-[12px] text-[var(--site-muted)]">
          <Link href={links.home} className="hover:text-[var(--site-primary)]">
            Início
          </Link>
          <span className="mx-2">/</span>
          <span className="text-[var(--site-text)]">{title}</span>
        </nav>

        <h1 className="text-[34px] leading-tight" style={{ fontFamily: "var(--site-font-heading)" }}>
          {title}
        </h1>

        {updatedAt ? (
          <p className="mt-2 text-[12px] text-[var(--site-muted)]">
            Atualizado em{" "}
            {new Date(updatedAt).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </p>
        ) : null}

        {/* `whitespace-pre-line` preserva os parágrafos que a revenda digitou:
            o texto vem de campo simples, não de editor rico */}
        <div className="mt-8 whitespace-pre-line text-[15px] leading-[1.75]">{body}</div>

        <p className="mt-10 border-t border-[var(--site-border)] pt-6 text-[13px] text-[var(--site-muted)]">
          Dúvidas sobre este documento? Fale com a {site.name} pelos canais da página de{" "}
          <Link href={links.contact} className="text-[var(--site-primary)] hover:underline">
            contato
          </Link>
          .
        </p>
      </article>
    </Shell>
  );
}
