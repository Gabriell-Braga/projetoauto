"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Breadcrumb } from "./breadcrumb";
import { NavLink } from "./nav-link";
import { RouteProgress } from "./route-progress";
import { ShellSearch } from "./shell-search";
import { UserMenu } from "./user-menu";
import type { ThemePreference } from "@/lib/theme";
import { cn } from "@/lib/utils";

export type NavItem = {
  href: string;
  label: string;
  icon?: React.ReactNode;
  exact?: boolean;
};

export type NavSection = {
  label?: string;
  items: NavItem[];
};

export type ShellUser = {
  name: string;
  email: string;
  roleLabel: string;
};

export function ShellFrame({
  wordmark,
  contextLabel,
  homeHref,
  sections,
  user,
  themePreference,
  search,
  banner,
  children,
}: {
  wordmark: string;
  contextLabel: string;
  homeHref: string;
  sections: NavSection[];
  user: ShellUser;
  themePreference: ThemePreference;
  search: { action: string; placeholder: string };
  banner?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const nav = (
    <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-4">
      {sections.map((section, index) => (
        <div key={section.label ?? index} className="flex flex-col gap-0.5">
          {section.label ? (
            <p className="label-instrument px-4 pb-2 text-faint">{section.label}</p>
          ) : null}
          {section.items.map((item) => (
            <NavLink key={item.href} {...item} onNavigate={() => setDrawerOpen(false)} />
          ))}
        </div>
      ))}
    </nav>
  );

  const brand = (
    <Link
      href={homeHref}
      onClick={() => setDrawerOpen(false)}
      className="flex h-[var(--topbar-h)] shrink-0 items-center border-b border-border px-6"
    >
      <span className="font-display text-base font-bold leading-none tracking-tight text-text">
        {wordmark}
      </span>
    </Link>
  );

  return (
    <div className="flex min-h-screen bg-bg">
      <Suspense fallback={null}>
        <RouteProgress />
      </Suspense>

      {/*
        Sidebar fixa: `sticky top-0` + altura de viewport. Sem isso ela e uma
        coluna flex comum e desce junto com o scroll da pagina em telas altas.
      */}
      <aside
        data-theme-transition
        className="sticky top-0 hidden h-[100dvh] w-[var(--sidebar-w)] shrink-0 flex-col border-r border-border bg-surface md:flex"
      >
        {brand}
        {nav}
        <div className="shrink-0 border-t border-border px-4 py-2.5">
          <p className="label-instrument text-faint">{contextLabel}</p>
        </div>
      </aside>

      {/* -------------------------------------------------- gaveta mobile */}
      {drawerOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label="Fechar navegação"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0"
            style={{ backgroundColor: "var(--overlay)" }}
          />
          <aside className="relative flex h-full w-[var(--sidebar-w)] flex-col border-r border-border bg-surface">
            {brand}
            {nav}
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* ------------------------------------------------ topbar */}
        <header
          data-theme-transition
          className="sticky top-0 z-30 flex h-[var(--topbar-h)] shrink-0 items-center gap-4 border-b border-border bg-surface px-4 sm:px-6"
        >
          <button
            type="button"
            aria-label="Abrir navegação"
            onClick={() => setDrawerOpen(true)}
            className={cn(
              "grid h-11 w-11 shrink-0 place-items-center rounded-tag text-muted",
              "transition-colors hover:bg-surface-2 hover:text-text md:hidden",
            )}
          >
            {drawerOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>

          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate font-display text-base font-medium text-text">
              {contextLabel}
            </span>
            <Suspense fallback={null}>
              <Breadcrumb />
            </Suspense>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <ShellSearch action={search.action} placeholder={search.placeholder} />
            <UserMenu
              name={user.name}
              email={user.email}
              roleLabel={user.roleLabel}
              themePreference={themePreference}
            />
          </div>
        </header>

        {banner}

        <main className="flex-1 px-4 py-5 sm:px-6 sm:py-6">{children}</main>
      </div>
    </div>
  );
}
