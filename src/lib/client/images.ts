"use client";

/**
 * Redimensionamento no browser.
 *
 * O runtime do Webflow Cloud (Workers) não tem `sharp`, então as variantes são
 * geradas aqui e o servidor só recebe arquivos já leves.
 */

export type VariantName = "thumb" | "card" | "full";

export const VARIANT_WIDTHS: Record<VariantName, number> = {
  thumb: 400,
  card: 800,
  full: 1600,
};

const QUALITY: Record<VariantName, number> = {
  thumb: 0.75,
  card: 0.82,
  full: 0.85,
};

export type GeneratedVariants = {
  blobs: Record<VariantName, Blob>;
  width: number;
  height: number;
  originalSize: number;
};

export const ACCEPTED_INPUT = "image/jpeg,image/png,image/webp,image/heic,image/heif";

export const MAX_INPUT_BYTES = 25 * 1024 * 1024;

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Falha ao converter a imagem"))),
      type,
      quality,
    );
  });
}

function supportsWebp(): boolean {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL("image/webp").startsWith("data:image/webp");
}

async function loadBitmap(file: File): Promise<ImageBitmap> {
  // "from-image" respeita a orientação EXIF das fotos de celular
  return createImageBitmap(file, { imageOrientation: "from-image" });
}

export async function generateVariants(file: File): Promise<GeneratedVariants> {
  if (file.size > MAX_INPUT_BYTES) {
    throw new Error("Imagem acima de 25 MB. Reduza o arquivo antes de enviar.");
  }

  const bitmap = await loadBitmap(file);
  const type = supportsWebp() ? "image/webp" : "image/jpeg";
  const blobs = {} as Record<VariantName, Blob>;

  try {
    for (const variant of Object.keys(VARIANT_WIDTHS) as VariantName[]) {
      const targetWidth = Math.min(VARIANT_WIDTHS[variant], bitmap.width);
      const scale = targetWidth / bitmap.width;
      const targetHeight = Math.round(bitmap.height * scale);

      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const context = canvas.getContext("2d");
      if (!context) throw new Error("Navegador sem suporte a canvas 2D");
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.drawImage(bitmap, 0, 0, targetWidth, targetHeight);

      blobs[variant] = await canvasToBlob(canvas, type, QUALITY[variant]);
    }

    return {
      blobs,
      width: bitmap.width,
      height: bitmap.height,
      originalSize: file.size,
    };
  } finally {
    bitmap.close();
  }
}

export function variantExtension(blob: Blob): string {
  return blob.type === "image/webp" ? "webp" : "jpg";
}

export function buildPhotoFormData(variants: GeneratedVariants): FormData {
  const extension = variantExtension(variants.blobs.full);
  const formData = new FormData();

  for (const variant of Object.keys(variants.blobs) as VariantName[]) {
    formData.append(
      variant,
      variants.blobs[variant],
      `${variant}.${extension}`,
    );
  }

  formData.append("width", String(variants.width));
  formData.append("height", String(variants.height));
  formData.append("sizeBytes", String(variants.blobs.full.size));

  return formData;
}

/** Redimensiona para uma única variante (logo, banner) e devolve o Blob. */
export async function resizeSingle(file: File, maxWidth: number, quality = 0.85): Promise<Blob> {
  if (file.size > MAX_INPUT_BYTES) {
    throw new Error("Imagem acima de 25 MB. Reduza o arquivo antes de enviar.");
  }

  const bitmap = await loadBitmap(file);
  try {
    const targetWidth = Math.min(maxWidth, bitmap.width);
    const scale = targetWidth / bitmap.width;
    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = Math.round(bitmap.height * scale);

    const context = canvas.getContext("2d");
    if (!context) throw new Error("Navegador sem suporte a canvas 2D");
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    // PNG preserva transparência (importante para logo)
    const type = file.type === "image/png" ? "image/png" : supportsWebp() ? "image/webp" : "image/jpeg";
    return canvasToBlob(canvas, type, quality);
  } finally {
    bitmap.close();
  }
}

export function blobFileName(blob: Blob, base: string): string {
  const extension =
    blob.type === "image/png" ? "png" : blob.type === "image/webp" ? "webp" : "jpg";
  return `${base}.${extension}`;
}
