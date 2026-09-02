"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/** Item ativo = trilho âmbar de 2px à esquerda. Sem fundo pintado. */
export function NavLink({
  href,
  label,
  icon,
  exact = false,
  onNavigate,
}: {
  href: string;
  label: string;
  icon?: React.ReactNode;
  exact?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      // superfície arredondada em vez da barra lateral: o C4MP marca seleção
      // por bloco, e a barra de 2px era assinatura do sistema anterior
      className={cn(
        "flex h-9 items-center gap-2.5 rounded-tag px-3 text-sm transition-colors duration-200 ease-out",
        active
          ? "bg-accent-soft font-medium text-accent-text"
          : "text-muted hover:bg-surface-2 hover:text-text",
      )}
    >
      <span className={cn("shrink-0", active ? "text-accent-text" : "text-faint")}>{icon}</span>
      <span className="truncate">{label}</span>
    </Link>
  );
}
