import Link from "next/link";
import { LogoutButton } from "./logout-button";
import { NavLink } from "./nav-link";

export type NavItem = {
  href: string;
  label: string;
  icon?: React.ReactNode;
  exact?: boolean;
};

export function AppShell({
  brandLabel,
  brandHref,
  subtitle,
  nav,
  user,
  banner,
  children,
}: {
  brandLabel: string;
  brandHref: string;
  subtitle?: string;
  nav: NavItem[];
  user: { name: string; email: string; roleLabel: string };
  banner?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-ink-100">
      <aside className="hidden w-60 shrink-0 flex-col bg-ink-950 px-3 py-5 md:flex">
        <Link href={brandHref} className="mb-6 block px-3">
          <span className="block text-sm font-semibold text-white">{brandLabel}</span>
          {subtitle ? <span className="mt-0.5 block text-xs text-ink-400">{subtitle}</span> : null}
        </Link>

        <nav className="flex flex-1 flex-col gap-1">
          {nav.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </nav>

        <div className="mt-4 border-t border-ink-800 pt-4">
          <div className="mb-2 px-3">
            <p className="truncate text-sm font-medium text-white">{user.name}</p>
            <p className="truncate text-xs text-ink-400">{user.email}</p>
            <p className="mt-1 text-[11px] uppercase tracking-wide text-ink-500">{user.roleLabel}</p>
          </div>
          <Link
            href="/trocar-senha"
            className="mb-1 block rounded-lg px-3 py-2 text-sm text-ink-300 transition-colors hover:bg-ink-800 hover:text-white"
          >
            Trocar senha
          </Link>
          <LogoutButton />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {banner}
        <nav className="flex gap-1 overflow-x-auto bg-ink-950 px-3 py-2 md:hidden">
          {nav.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </nav>
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold text-ink-900">{title}</h1>
        {description ? <p className="mt-1 text-sm text-ink-500">{description}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
