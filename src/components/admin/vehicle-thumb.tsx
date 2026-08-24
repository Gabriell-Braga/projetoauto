import { ImageOff } from "lucide-react";
import { mediaUrl } from "@/lib/paths";
import { cn } from "@/lib/utils";

/**
 * Miniatura com proporção reservada: o espaço já existe antes da imagem
 * chegar, então a tabela não pula quando as fotos carregam.
 */
export function VehicleThumb({
  photoKey,
  alt,
  className,
}: {
  photoKey: string | null;
  alt: string;
  className?: string;
}) {
  const url = mediaUrl(photoKey);

  return (
    <div
      className={cn(
        "grid aspect-4/3 w-11 shrink-0 place-items-center overflow-hidden rounded-sm border border-border bg-surface-2",
        className,
      )}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={alt}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
        />
      ) : (
        <ImageOff aria-hidden="true" className="h-3.5 w-3.5 text-faint" />
      )}
    </div>
  );
}
