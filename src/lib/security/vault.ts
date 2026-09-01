import { ApiError } from "@/lib/http";

/**
 * Cofre para credenciais de terceiros.
 *
 * A revenda vai colar aqui usuário e senha da conta dela no portal. Isso não é
 * senha nossa: não dá para guardar só o hash, porque precisamos do valor
 * original para autenticar na API do portal. Então é cifrado em repouso, com
 * chave que vive fora do banco.
 *
 * Quem invadir o banco leva texto cifrado; quem levar só a chave não tem o que
 * decifrar. Precisa dos dois.
 */

const ALGORITHM = "AES-GCM";
const IV_BYTES = 12;
const VERSION = "v1";

/**
 * Chave mestra vinda das variáveis secretas.
 *
 * Sem ela, guardar credencial é RECUSADO em vez de gravado em claro. Uma falha
 * barulhenta na hora de cadastrar é muito melhor do que descobrir meses depois
 * que o banco tem senha de portal em texto puro.
 */
async function masterKey(): Promise<CryptoKey> {
  const secret = process.env.VAULT_KEY;
  if (!secret) {
    throw new ApiError(
      500,
      "VAULT_KEY não configurado. Sem ele não guardamos credencial de portal.",
    );
  }

  const raw = base64ToBytes(secret);
  if (raw.byteLength !== 32) {
    throw new ApiError(500, "VAULT_KEY precisa ter 32 bytes em base64.");
  }

  // `.buffer` porque o tipo de Uint8Array genérico não satisfaz BufferSource
  return crypto.subtle.importKey("raw", raw.buffer as ArrayBuffer, ALGORITHM, false, [
    "encrypt",
    "decrypt",
  ]);
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

/**
 * Cifra e devolve tudo o que é preciso para decifrar depois.
 *
 * O IV é novo a cada chamada e viaja junto com o texto cifrado — reutilizar IV
 * em AES-GCM quebra a confidencialidade, e guardá-lo separado só criaria duas
 * coisas para não perder em vez de uma.
 */
export async function seal(plaintext: string): Promise<string> {
  const key = await masterKey();
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));

  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    new TextEncoder().encode(plaintext).buffer as ArrayBuffer,
  );

  return [VERSION, bytesToBase64(iv), bytesToBase64(new Uint8Array(ciphertext))].join(":");
}

export async function open(sealed: string): Promise<string> {
  const [version, ivPart, dataPart] = sealed.split(":");
  if (version !== VERSION || !ivPart || !dataPart) {
    throw new ApiError(500, "Credencial guardada em formato desconhecido.");
  }

  const key = await masterKey();
  const plaintext = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv: base64ToBytes(ivPart).buffer as ArrayBuffer },
    key,
    base64ToBytes(dataPart).buffer as ArrayBuffer,
  );

  return new TextDecoder().decode(plaintext);
}

export function isVaultConfigured(): boolean {
  return Boolean(process.env.VAULT_KEY);
}

/**
 * Máscara para exibir na tela.
 *
 * Mostra o suficiente para a pessoa reconhecer qual credencial é aquela, sem
 * revelar o valor. Segredo curto vira só asteriscos: mostrar dois caracteres
 * de uma senha de seis é entregar um terço dela.
 */
export function maskSecret(value: string): string {
  if (value.length <= 8) return "•".repeat(8);
  return `${value.slice(0, 3)}${"•".repeat(6)}${value.slice(-2)}`;
}

/** Gera uma chave mestra nova, para o cadastro nas variáveis secretas. */
export function generateVaultKey(): string {
  return bytesToBase64(crypto.getRandomValues(new Uint8Array(32)));
}
