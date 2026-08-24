"use client";

import { TEMPLATE_MANIFESTS } from "@/templates/manifests";
import { cn } from "@/lib/utils";

/** Cada opção é uma miniatura do template, não um card decorado. */
export function TemplatePicker({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (templateId: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
      {TEMPLATE_MANIFESTS.map((template) => {
        const selectable = template.status === "ready" && !disabled;
        const selected = value === template.id;

        return (
          <button
            key={template.id}
            type="button"
            disabled={!selectable}
            aria-pressed={selected}
            onClick={() => onChange(template.id)}
            className={cn(
              "rounded border p-2.5 text-left transition-colors",
              selected ? "border-accent" : "border-border hover:border-border-strong",
              !selectable && "cursor-not-allowed opacity-50",
            )}
          >
            <div
              className="mb-2.5 flex h-20 flex-col justify-between rounded-sm p-2"
              style={{
                backgroundColor: template.preview.background,
                color: template.preview.foreground,
              }}
            >
              <div className="flex items-center gap-1.5">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: template.preview.accent }}
                />
                <span className="label-instrument opacity-60">{template.name}</span>
              </div>
              <div className="space-y-1">
                <div
                  className="h-1 w-2/3 rounded-full"
                  style={{ backgroundColor: template.preview.accent }}
                />
                <div className="flex gap-1 pt-0.5">
                  {[0, 1, 2].map((index) => (
                    <div
                      key={index}
                      className="h-4 flex-1 rounded-sm opacity-20"
                      style={{ backgroundColor: template.preview.foreground }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <p className="flex items-center gap-2 text-[13px] font-medium text-text">
              {template.name}
              {template.status === "coming_soon" ? (
                <span className="label-instrument text-faint">em breve</span>
              ) : null}
            </p>
            <p className="mt-0.5 text-xs text-faint">{template.vibe}</p>
            <p className="mt-1 text-xs leading-snug text-muted">{template.description}</p>
          </button>
        );
      })}
    </div>
  );
}
