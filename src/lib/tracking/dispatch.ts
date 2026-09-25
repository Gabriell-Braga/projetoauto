import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { tenantSites, type TrackingSecrets, type TrackingSettings } from "@/db/schema";
import { open } from "@/lib/security/vault";
import type { TrackedEvent } from "./event";
import { sendGa4Event } from "./ga4";
import { sendMetaEvent } from "./meta";

/**
 * Manda o evento para todas as plataformas que a revenda ligou.
 *
 * Regras que valem para o arquivo inteiro:
 *
 * - **Nunca derruba quem chamou.** Um lead salvo é um lead salvo; se a Meta
 *   estiver fora do ar, o pior que pode acontecer é a conversão não ser
 *   contada. Erro daqui vira log, não exceção.
 * - **Sem configuração, não faz nada.** A revenda que não ligou conector
 *   nenhum não paga latência por isso.
 * - **O segredo não sai daqui.** Token da Meta e api_secret do GA4 são lidos
 *   do cofre neste módulo e não voltam para quem chamou.
 */

export type TrackingConfig = {
  settings: TrackingSettings;
  secrets: TrackingSecrets;
};

export async function getTrackingConfig(tenantId: string): Promise<TrackingConfig> {
  const db = await getDb();
  const rows = await db
    .select({ tracking: tenantSites.tracking, secrets: tenantSites.trackingSecrets })
    .from(tenantSites)
    .where(eq(tenantSites.tenantId, tenantId))
    .limit(1);

  const settings = rows[0]?.tracking ?? {};
  const sealed = rows[0]?.secrets ?? null;

  let secrets: TrackingSecrets = {};
  if (sealed) {
    try {
      secrets = JSON.parse(await open(sealed)) as TrackingSecrets;
    } catch (error) {
      // cofre trocado ou blob corrompido: segue sem server-side, e avisa no log
      console.error("[tracking] não abri os segredos da revenda", tenantId, error);
    }
  }

  return { settings, secrets };
}

/** O que a tela mostra: ligado ou não, sem revelar o segredo. */
export function trackingStatus(config: TrackingConfig) {
  return {
    metaPixel: Boolean(config.settings.metaPixelId),
    metaServer: Boolean(
      config.settings.serverSide && config.settings.metaPixelId && config.secrets.metaAccessToken,
    ),
    ga4: Boolean(config.settings.ga4MeasurementId),
    ga4Server: Boolean(
      config.settings.serverSide && config.settings.ga4MeasurementId && config.secrets.ga4ApiSecret,
    ),
    googleAds: Boolean(config.settings.googleAdsId),
  };
}

export type DispatchResult = {
  meta?: { ok: boolean; error?: string };
  ga4?: { ok: boolean; error?: string };
};

/**
 * Dispara o evento pelo servidor.
 *
 * Devolve o que cada plataforma respondeu — a tela de conferência usa isso
 * para a revenda ver que o conector está de pé sem precisar abrir o
 * Gerenciador de Eventos.
 */
export async function trackServerEvent(
  tenantId: string,
  event: TrackedEvent,
  config?: TrackingConfig,
): Promise<DispatchResult> {
  const resolved = config ?? (await getTrackingConfig(tenantId));
  const { settings, secrets } = resolved;
  if (!settings.serverSide) return {};

  const jobs: Promise<void>[] = [];
  const result: DispatchResult = {};

  if (settings.metaPixelId && secrets.metaAccessToken) {
    jobs.push(
      sendMetaEvent(event, {
        pixelId: settings.metaPixelId,
        accessToken: secrets.metaAccessToken,
      }).then((outcome) => {
        result.meta = outcome.ok ? { ok: true } : { ok: false, error: outcome.error };
        if (!outcome.ok) console.error("[tracking] Meta recusou", tenantId, outcome.error);
      }),
    );
  }

  if (settings.ga4MeasurementId && secrets.ga4ApiSecret) {
    jobs.push(
      sendGa4Event(event, {
        measurementId: settings.ga4MeasurementId,
        apiSecret: secrets.ga4ApiSecret,
      }).then((outcome) => {
        result.ga4 = outcome.ok ? { ok: true } : { ok: false, error: outcome.error };
        if (!outcome.ok) console.error("[tracking] GA4 recusou", tenantId, outcome.error);
      }),
    );
  }

  await Promise.all(jobs);
  return result;
}

/**
 * Dispara sem segurar a resposta de quem chamou.
 *
 * Salvar um lead não pode esperar duas APIs de terceiro. No Cloudflare o
 * `waitUntil` mantém o worker vivo depois do retorno; fora dele (dev, testes)
 * espera mesmo, para o comportamento continuar observável.
 */
export async function trackInBackground(tenantId: string, event: TrackedEvent): Promise<void> {
  const job = trackServerEvent(tenantId, event).then(
    () => undefined,
    (error) => {
      console.error("[tracking] falhou", tenantId, error);
    },
  );

  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const context = await getCloudflareContext({ async: true });
    context.ctx.waitUntil(job);
  } catch {
    await job;
  }
}
