"use client";

import { apiUrl } from "@/lib/paths";

export type ApiResponse<T> = { ok: true; data: T } | { ok: false; error: string; details?: unknown };

async function request<T>(path: string, init: RequestInit): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(apiUrl(path), {
      credentials: "same-origin",
      ...init,
      headers: { "content-type": "application/json", ...(init.headers ?? {}) },
    });
    const payload = (await response.json().catch(() => null)) as ApiResponse<T> | null;
    if (!payload) return { ok: false, error: "Resposta inválida do servidor" };
    return payload;
  } catch {
    return { ok: false, error: "Falha de conexão. Tente novamente." };
  }
}

export const apiGet = <T,>(path: string) => request<T>(path, { method: "GET" });

export const apiPost = <T,>(path: string, body?: unknown) =>
  request<T>(path, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) });

export const apiPatch = <T,>(path: string, body?: unknown) =>
  request<T>(path, { method: "PATCH", body: body === undefined ? undefined : JSON.stringify(body) });

export const apiPut = <T,>(path: string, body?: unknown) =>
  request<T>(path, { method: "PUT", body: body === undefined ? undefined : JSON.stringify(body) });

export const apiDelete = <T,>(path: string) => request<T>(path, { method: "DELETE" });

/** Upload multipart (fotos) — não define content-type para o browser montar o boundary. */
export async function apiUpload<T>(path: string, formData: FormData): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(apiUrl(path), {
      method: "POST",
      credentials: "same-origin",
      body: formData,
    });
    const payload = (await response.json().catch(() => null)) as ApiResponse<T> | null;
    return payload ?? { ok: false, error: "Resposta inválida do servidor" };
  } catch {
    return { ok: false, error: "Falha de conexão durante o upload." };
  }
}
