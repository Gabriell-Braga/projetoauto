"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, KeyRound, LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Spinner } from "@/components/ui/spinner";
import { apiPost } from "@/lib/client/api";
import type { ThemePreference } from "@/lib/theme";
import { cn } from "@/lib/utils";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? (parts.at(-1)?.[0] ?? "") : "")).toUpperCase();
}

export function UserMenu({
  name,
  email,
  roleLabel,
  themePreference,
}: {
  name: string;
  email: string;
  roleLabel: string;
  themePreference: ThemePreference;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointer(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  async function handleLogout() {
    setLeaving(true);
    await apiPost("/api/auth/logout");
    router.replace("/login");
    router.refresh();
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "flex h-8 items-center gap-2 rounded px-1.5 pr-2 transition-colors",
          open ? "bg-surface-2" : "hover:bg-surface-2",
        )}
      >
        <span className="grid h-6 w-6 place-items-center rounded-sm border border-border bg-surface-2 text-[10px] font-semibold text-muted">
          {initials(name)}
        </span>
        <span className="hidden max-w-32 truncate text-[13px] text-text sm:block">{name}</span>
        <ChevronDown className="h-3.5 w-3.5 text-faint" />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-9 z-40 w-64 rounded border border-border bg-surface"
          style={{ boxShadow: "var(--shadow-menu)" }}
        >
          <div className="border-b border-border px-3 py-2.5">
            <p className="truncate text-[13px] font-medium text-text">{name}</p>
            <p className="truncate text-xs text-muted">{email}</p>
            <p className="label-instrument mt-1.5 text-faint">{roleLabel}</p>
          </div>

          <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-2.5">
            <span className="label-instrument text-muted">Tema</span>
            <ThemeToggle current={themePreference} />
          </div>

          <div className="p-1">
            <Link
              href="/trocar-senha"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded px-2 py-1.5 text-[13px] text-muted transition-colors hover:bg-surface-2 hover:text-text"
            >
              <KeyRound className="h-3.5 w-3.5" />
              Trocar senha
            </Link>
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              disabled={leaving}
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-[13px] text-muted transition-colors hover:bg-surface-2 hover:text-text disabled:opacity-60"
            >
              {leaving ? <Spinner className="text-muted" /> : <LogOut className="h-3.5 w-3.5" />}
              Sair
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
