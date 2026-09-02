import Link from "next/link";
import { cn } from "@/lib/utils";

export type TabItem = { key: string; label: string; href: string };

/**
 * Abas de navegação por link (funcionam sem JS).
 * Ativa = trilho âmbar de 2px embaixo, no mesmo espírito da sidebar.
 */
export function Tabs({ items, active }: { items: TabItem[]; active: string }) {
  return (
    <nav className="mb-5 flex gap-0.5 border-b border-border">
      {items.map((item) => {
        const selected = item.key === active;
        return (
          <Link
            key={item.key}
            href={item.href}
            aria-current={selected ? "page" : undefined}
            className={cn(
              "-mb-px border-b-2 px-4 py-3 text-base transition-colors duration-200 ease-out",
              selected
                ? "border-b-accent font-medium text-text"
                : "border-b-transparent text-muted hover:text-text",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
