"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { VehiclePhotoView } from "@/templates/contract";
import { cn } from "@/lib/utils";

/**
 * Galeria compartilhada entre templates.
 * A interação é a mesma; a aparência vem das classes que o template passa.
 */
export function PhotoGallery({
  photos,
  title,
  tone = "light",
}: {
  photos: VehiclePhotoView[];
  title: string;
  tone?: "light" | "dark";
}) {
  const [index, setIndex] = useState(0);

  if (photos.length === 0) {
    return (
      <div
        className={cn(
          "flex aspect-4/3 w-full items-center justify-center rounded-xl text-sm",
          tone === "dark" ? "bg-white/5 text-white/40" : "bg-black/5 text-black/40",
        )}
      >
        Sem fotos disponíveis
      </div>
    );
  }

  const current = photos[Math.min(index, photos.length - 1)];

  function step(direction: -1 | 1) {
    setIndex((value) => (value + direction + photos.length) % photos.length);
  }

  return (
    <div>
      <div className="relative overflow-hidden rounded-xl bg-black/5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current.full}
          alt={title}
          className="aspect-4/3 w-full bg-black/5 object-cover"
        />

        {photos.length > 1 ? (
          <>
            <button
              type="button"
              aria-label="Foto anterior"
              onClick={() => step(-1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white backdrop-blur transition-colors hover:bg-black/70"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Próxima foto"
              onClick={() => step(1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white backdrop-blur transition-colors hover:bg-black/70"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2.5 py-1 text-xs text-white">
              {index + 1}/{photos.length}
            </span>
          </>
        ) : null}
      </div>

      {photos.length > 1 ? (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {photos.map((photo, photoIndex) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => setIndex(photoIndex)}
              aria-label={`Ver foto ${photoIndex + 1}`}
              className={cn(
                "h-16 w-22 shrink-0 overflow-hidden rounded-lg border-2 transition-all",
                photoIndex === index
                  ? "border-[var(--site-primary)]"
                  : tone === "dark"
                    ? "border-white/10 opacity-60 hover:opacity-100"
                    : "border-black/10 opacity-60 hover:opacity-100",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.thumb} alt="" className="h-full w-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
