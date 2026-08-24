"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

/**
 * Busca da topbar. Não é enfeite: leva para a listagem principal do painel
 * já com o termo aplicado.
 */
export function ShellSearch({
  action,
  placeholder,
}: {
  action: string;
  placeholder: string;
}) {
  const router = useRouter();
  const [term, setTerm] = useState("");

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const value = term.trim();
    router.push(value ? `${action}?q=${encodeURIComponent(value)}` : action);
  }

  return (
    <form onSubmit={handleSubmit} role="search" className="relative hidden lg:block">
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-faint"
      />
      <input
        type="search"
        value={term}
        onChange={(event) => setTerm(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-7 w-64 rounded border border-border bg-surface-2 pl-8 pr-2.5 text-[13px] text-text transition-colors hover:border-border-strong focus:border-accent focus:bg-surface focus:outline-none"
      />
    </form>
  );
}
