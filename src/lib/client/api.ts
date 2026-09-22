"use client";

/** Ponte para o pacote compartilhado — veja `@/lib/paths`. */
export {
  apiGet,
  apiPost,
  apiPatch,
  apiPut,
  apiDelete,
  apiUpload,
  fieldErrorsFrom,
  errorMessageFrom,
  unmappedErrors,
  type ApiResponse,
  type FieldErrors,
} from "@carbud/site-kit/client-api";
