"use client";

import { useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { BASE_PATH } from "@/lib/paths";
import {
  THEME_COOKIE,
  THEME_LABELS,
  THEME_PREFERENCES,
  type ThemePreference,
} from "@/lib/theme";
import { cn } from "@/lib/utils";

const ICONS: Record<ThemePreference, typeof Sun> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
};

function applyTheme(preference: ThemePreference) {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  if (preference !== "system") root.classList.add(preference);

  document.cookie = [
    `${THEME_COOKIE}=${preference}`,
    `path=${BASE_PATH || "/"}`,
    "max-age=31536000",
    "samesite=lax",
  ].join("; ");
}

/** Três opções em um seletor segmentado, do jeito de ferramenta: sem menu extra. */
export function ThemeToggle({ current }: { current: ThemePreference }) {
  const [preference, setPreference] = useState<ThemePreference>(current);

  function handleSelect(next: ThemePreference) {
    setPreference(next);
    applyTheme(next);
  }

  return (
    <div
      role="radiogroup"
      aria-label="Tema do painel"
      className="flex items-center gap-0.5 rounded border border-border bg-surface-2 p-0.5"
    >
      {THEME_PREFERENCES.map((option) => {
        const Icon = ICONS[option];
        const active = preference === option;
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={active}
            title={THEME_LABELS[option]}
            onClick={() => handleSelect(option)}
            className={cn(
              "flex h-6 w-7 items-center justify-center rounded-sm transition-colors",
              active
                ? "bg-surface text-accent-text"
                : "text-faint hover:text-muted",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="sr-only">{THEME_LABELS[option]}</span>
          </button>
        );
      })}
    </div>
  );
}
