/**
 * Preferência de tema do painel.
 *
 * Guardada em cookie (não em localStorage) para o SSR já renderizar no tema
 * certo — sem flash de tema errado. Quando a preferência é "system" nenhuma
 * classe é aplicada e o próprio CSS resolve via `prefers-color-scheme`,
 * então não existe script bloqueante no <head>.
 */
export const THEME_COOKIE = "pa_theme";

export const THEME_PREFERENCES = ["light", "dark", "system"] as const;
export type ThemePreference = (typeof THEME_PREFERENCES)[number];

export const DEFAULT_THEME_PREFERENCE: ThemePreference = "system";

export function isThemePreference(value: unknown): value is ThemePreference {
  return typeof value === "string" && (THEME_PREFERENCES as readonly string[]).includes(value);
}

/** Classe aplicada no <html>. "system" não recebe classe: o CSS decide. */
export function themeClassName(preference: ThemePreference): string {
  return preference === "system" ? "" : preference;
}

export const THEME_LABELS: Record<ThemePreference, string> = {
  light: "Claro",
  dark: "Escuro",
  system: "Sistema",
};
