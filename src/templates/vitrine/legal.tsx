import Link from "next/link";
import type { LegalProps } from "@/templates/contract";
import { SHELL, Shell } from "./chrome";

/**
 * Página de texto corrido: privacidade e termos.
 *
 * Sem card e sem seção. O conteúdo é jurídico, varia de tamanho de forma
 * imprevisível e existe para ser lido do começo ao fim — moldura decorativa só
 * estreita a coluna e atrapalha.
 *
 * A largura fica em 68 caracteres aproximados (`max-w-3xl`): linha mais longa
 * que isso faz o olho perder a próxima ao voltar, e é o tipo de texto que
 * ninguém lê duas vezes.
 */
export function Legal({ site, links, title, body, updatedAt }: LegalProps) {
  return (
    <Shell site={site} links={links}>
      <article className={`${SHELL} max-w-3xl py-14`}>
        <nav className="mb-6 text-[13px] text-[var(--site-muted)]">
          <Link href={links.home} className="hover:text-[var(--site-primary)]">
            Início
          </Link>
          <span className="mx-2">/</span>
          <span className="text-[var(--site-text)]">{title}</span>
        </nav>

        <h1
          className="text-[32px] font-bold leading-tight text-[var(--site-text)]"
          style={{ fontFamily: "var(--site-font-heading)" }}
        >
          {title}
        </h1>

        {updatedAt ? (
          <p className="mt-2 text-[13px] text-[var(--site-muted)]">
            Atualizado em{" "}
            {new Date(updatedAt).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </p>
        ) : null}

        {/*
          `whitespace-pre-line` preserva os parágrafos que a revenda digitou.
          O texto vem de um campo de texto simples, não de editor rico: sem
          isso, o documento inteiro viraria um bloco único e ilegível.
        */}
        <div className="mt-8 whitespace-pre-line text-[15px] leading-[1.75] text-[var(--site-text)]">
          {body}
        </div>

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
