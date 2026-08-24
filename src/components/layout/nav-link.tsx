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
      className={cn(
        "flex h-8 items-center gap-2.5 border-l-2 pl-3 pr-2 text-[13px] transition-colors",
        active
          ? "border-l-accent font-medium text-text"
          : "border-l-transparent text-muted hover:bg-surface-2 hover:text-text",
      )}
    >
      <span className={cn("shrink-0", active ? "text-accent" : "text-faint")}>{icon}</span>
      <span className="truncate">{label}</span>
    </Link>
  );
}
