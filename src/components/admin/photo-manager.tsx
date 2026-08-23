"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Star, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiDelete, apiPatch, apiUpload } from "@/lib/client/api";
import { ACCEPTED_INPUT, buildPhotoFormData, generateVariants } from "@/lib/client/images";
import { mediaUrl } from "@/lib/paths";
import { cn } from "@/lib/utils";

export type PhotoItem = {
  id: string;
  variants: { thumb: string; card: string; full: string };
  isCover: boolean;
  position: number;
};

export function PhotoManager({
  vehicleId,
  photos,
  disabled,
}: {
  vehicleId: string;
  photos: PhotoItem[];
  disabled?: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<PhotoItem[]>(photos);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);

    setBusy(true);
    setError(null);
    setProgress({ done: 0, total: files.length });

    for (const [index, file] of files.entries()) {
      try {
        const variants = await generateVariants(file);
        const result = await apiUpload<{ photos: PhotoItem[] }>(
          `/api/admin/vehicles/${vehicleId}/photos`,
          buildPhotoFormData(variants),
        );

        if (!result.ok) {
          setError(`${file.name}: ${result.error}`);
          break;
        }
        setItems(result.data.photos);
      } catch (uploadError) {
        setError(
          uploadError instanceof Error
            ? `${file.name}: ${uploadError.message}`
            : `Falha ao processar ${file.name}`,
        );
        break;
      }
      setProgress({ done: index + 1, total: files.length });
    }

    setBusy(false);
    setProgress(null);
    if (inputRef.current) inputRef.current.value = "";
    router.refresh();
  }

  async function persistOrder(next: PhotoItem[]) {
    setItems(next);
    setBusy(true);
    const result = await apiPatch(`/api/admin/vehicles/${vehicleId}/photos`, {
      photoIds: next.map((photo) => photo.id),
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    void persistOrder(next);
  }

  async function handleCover(photoId: string) {
    setBusy(true);
    setError(null);
    const result = await apiPatch(`/api/admin/vehicles/${vehicleId}/photos`, { photoId });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setItems((current) =>
      current.map((photo) => ({ ...photo, isCover: photo.id === photoId })),
    );
    router.refresh();
  }

  async function handleDelete(photoId: string) {
    if (!window.confirm("Remover esta foto?")) return;
    setBusy(true);
    setError(null);
    const result = await apiDelete(`/api/admin/vehicles/${vehicleId}/photos/${photoId}`);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setItems((current) => current.filter((photo) => photo.id !== photoId));
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fotos</CardTitle>
        <CardDescription>
          A primeira foto é a capa. As imagens são redimensionadas no seu navegador antes do envio
          (miniatura, listagem e ampliada).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED_INPUT}
          className="hidden"
          onChange={(event) => handleFiles(event.target.files)}
          disabled={disabled || busy}
        />

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            disabled={disabled || busy}
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="h-4 w-4" />
            Adicionar fotos
          </Button>
          {progress ? (
            <span className="text-sm text-ink-500">
              Enviando {progress.done + 1} de {progress.total}...
            </span>
          ) : null}
          <span className="text-xs text-ink-500">{items.length} de 40 fotos</span>
        </div>

        {error ? (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        {items.length === 0 ? (
          <p className="rounded-lg border border-dashed border-ink-200 px-4 py-10 text-center text-sm text-ink-500">
            Nenhuma foto ainda. Anúncios com fotos recebem muito mais contatos.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((photo, index) => (
              <div
                key={photo.id}
                className={cn(
                  "group relative overflow-hidden rounded-lg border bg-ink-100",
                  photo.isCover ? "border-brand-500 ring-2 ring-brand-100" : "border-ink-200",
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={mediaUrl(photo.variants.thumb) ?? ""}
                  alt={`Foto ${index + 1}`}
                  className="aspect-4/3 w-full object-cover"
                  loading="lazy"
                />

                {photo.isCover ? (
                  <span className="absolute left-1.5 top-1.5 rounded bg-brand-600 px-1.5 py-0.5 text-[10px] font-medium text-white">
                    Capa
                  </span>
                ) : null}

                <div className="flex items-center justify-between gap-1 border-t border-ink-200 bg-white px-1.5 py-1">
                  <div className="flex gap-0.5">
                    <button
                      type="button"
                      title="Mover para a esquerda"
                      className="rounded p-1 text-ink-500 hover:bg-ink-100 disabled:opacity-30"
                      disabled={disabled || busy || index === 0}
                      onClick={() => move(index, -1)}
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      title="Mover para a direita"
                      className="rounded p-1 text-ink-500 hover:bg-ink-100 disabled:opacity-30"
                      disabled={disabled || busy || index === items.length - 1}
                      onClick={() => move(index, 1)}
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="flex gap-0.5">
                    <button
                      type="button"
                      title="Definir como capa"
                      className={cn(
                        "rounded p-1 hover:bg-ink-100 disabled:opacity-30",
                        photo.isCover ? "text-brand-600" : "text-ink-500",
                      )}
                      disabled={disabled || busy || photo.isCover}
                      onClick={() => handleCover(photo.id)}
                    >
                      <Star className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      title="Remover foto"
                      className="rounded p-1 text-ink-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                      disabled={disabled || busy}
                      onClick={() => handleDelete(photo.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
