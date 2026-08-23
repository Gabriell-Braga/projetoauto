"use client";

import { TEMPLATE_MANIFESTS } from "@/templates/manifests";
import { cn } from "@/lib/utils";

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
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {TEMPLATE_MANIFESTS.map((template) => {
        const selectable = template.status === "ready" && !disabled;
        const selected = value === template.id;

        return (
          <button
            key={template.id}
            type="button"
            disabled={!selectable}
            onClick={() => onChange(template.id)}
            className={cn(
              "rounded-xl border p-3 text-left transition-all",
              selected ? "border-brand-500 ring-2 ring-brand-100" : "border-ink-200 hover:border-ink-300",
              !selectable && "cursor-not-allowed opacity-60",
            )}
          >
            <div
              className="mb-3 flex h-24 flex-col justify-between rounded-lg p-2.5"
              style={{ backgroundColor: template.preview.background, color: template.preview.foreground }}
            >
              <div className="flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: template.preview.accent }}
                />
                <span className="text-[10px] font-semibold uppercase tracking-wider opacity-70">
                  {template.name}
                </span>
              </div>
              <div className="space-y-1">
                <div className="h-1.5 w-3/4 rounded-full" style={{ backgroundColor: template.preview.accent }} />
                <div className="h-1.5 w-1/2 rounded-full opacity-30" style={{ backgroundColor: template.preview.foreground }} />
                <div className="flex gap-1 pt-1">
                  {[0, 1, 2].map((index) => (
                    <div
                      key={index}
                      className="h-5 flex-1 rounded opacity-20"
                      style={{ backgroundColor: template.preview.foreground }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <p className="flex items-center gap-2 text-sm font-medium text-ink-900">
              {template.name}
              {template.status === "coming_soon" ? (
                <span className="rounded bg-ink-100 px-1.5 py-0.5 text-[10px] font-normal text-ink-500">
                  em breve
                </span>
              ) : null}
            </p>
            <p className="mt-0.5 text-xs text-ink-500">{template.vibe}</p>
            <p className="mt-1 text-xs leading-snug text-ink-500">{template.description}</p>
          </button>
        );
      })}
    </div>
  );
}
