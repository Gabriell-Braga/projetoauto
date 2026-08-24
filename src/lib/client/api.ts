"use client";

import { apiUrl } from "@/lib/paths";

export type ApiResponse<T> =
  { ok: true; data: T } | { ok: false; error: string; details?: unknown };

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

export const apiGet = <T>(path: string) => request<T>(path, { method: "GET" });

export const apiPost = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) });

export const apiPatch = <T>(path: string, body?: unknown) =>
  request<T>(path, {
    method: "PATCH",
    body: body === undefined ? undefined : JSON.stringify(body),
  });

export const apiPut = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: "PUT", body: body === undefined ? undefined : JSON.stringify(body) });

export const apiDelete = <T>(path: string) => request<T>(path, { method: "DELETE" });

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

/* ------------------------------------------------------------------------ */
/* Erros de validação                                                        */
/* ------------------------------------------------------------------------ */

export type FieldErrors = Record<string, string>;

type RawIssue = { path?: unknown; message?: unknown };

/**
 * Normaliza os detalhes de erro da API em { campo: mensagem }.
 *
 * As rotas mandam duas formas: as issues cruas do zod (`path` como array) e a
 * versão já achatada do `jsonError` (`path` como string). Esta função aceita as
 * duas para o formulário sempre conseguir posicionar o erro no campo certo.
 */
export function fieldErrorsFrom(details: unknown): FieldErrors {
  if (!Array.isArray(details)) return {};

  const errors: FieldErrors = {};
  for (const raw of details as RawIssue[]) {
    if (typeof raw?.message !== "string") continue;
    const path = Array.isArray(raw.path) ? raw.path.join(".") : String(raw.path ?? "");
    if (!path) continue;
    // primeira mensagem por campo: a lista do zod pode trazer várias
    if (!errors[path]) errors[path] = raw.message;
  }
  return errors;
}

/** Mensagem mais útil para o toast: a primeira do detalhe, ou o erro geral. */
export function errorMessageFrom<T>(result: ApiResponse<T>): string {
  if (result.ok) return "";
  if (Array.isArray(result.details)) {
    const first = (result.details as RawIssue[]).find(
      (issue) => typeof issue?.message === "string",
    );
    if (first) return String(first.message);
  }
  return result.error;
}

/** Erros que não couberam em nenhum campo do formulário. */
export function unmappedErrors(fieldErrors: FieldErrors, known: string[]): string[] {
  return Object.entries(fieldErrors)
    .filter(([field]) => !known.includes(field))
    .map(([, message]) => message);
}
