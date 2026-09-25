"use client";

import Script from "next/script";
import { useEffect } from "react";

/**
 * Os conectores de mídia no navegador: pixel da Meta, GA4 e Google Ads.
 *
 * Um componente só para os três porque, do ponto de vista da revenda, é uma
 * configuração só: ela cola os ids no painel e o site passa a medir. Cada um
 * entra apenas se o id existir, e um id malformado não entra — tag quebrada
 * no site do cliente é pior do que medição faltando.
 *
 * O GTM continua existindo em paralelo: quem já tem um contêiner montado
 * prefere mandar tudo por lá. Estes aqui são o caminho de quem não quer
 * montar contêiner nenhum, que é o caso da maioria das lojas.
 */

export type TrackingIds = {
  metaPixelId?: string | null;
  ga4MeasurementId?: string | null;
  googleAdsId?: string | null;
  googleAdsLeadLabel?: string | null;
  googleAdsSaleLabel?: string | null;
};

const META_PIXEL = /^\d{6,20}$/;
const GA4_ID = /^G-[A-Z0-9]{4,15}$/i;
const ADS_ID = /^AW-\d{6,15}$/i;

export function TrackingScripts({ ids }: { ids: TrackingIds }) {
  const pixel = ids.metaPixelId && META_PIXEL.test(ids.metaPixelId) ? ids.metaPixelId : null;
  const ga4 = ids.ga4MeasurementId && GA4_ID.test(ids.ga4MeasurementId)
    ? ids.ga4MeasurementId.toUpperCase()
    : null;
  const ads = ids.googleAdsId && ADS_ID.test(ids.googleAdsId)
    ? ids.googleAdsId.toUpperCase()
    : null;

  // um gtag.js serve GA4 e Google Ads; carregar dois brigaria pela mesma fila
  const gtagId = ga4 ?? ads;

  /*
   * Os rótulos de conversão do Google Ads ficam num global.
   *
   * Assim o formulário e a ficha do veículo disparam a conversão sem receber
   * configuração nenhuma por props — eles não sabem (nem precisam saber) se a
   * loja anuncia no Google. Quem não configurou não tem o global, e o disparo
   * simplesmente não acontece.
   */
  const adsGlobal = ads
    ? JSON.stringify({
        id: ads,
        lead: ids.googleAdsLeadLabel ?? null,
        sale: ids.googleAdsSaleLabel ?? null,
      })
    : null;

  return (
    <>
      {adsGlobal ? (
        <Script id="carbud-ads" strategy="afterInteractive">
          {`window.__carbudAds=${adsGlobal};`}
        </Script>
      ) : null}
      {pixel ? (
        <>
          <Script id="meta-pixel" strategy="afterInteractive">
            {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window,document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${pixel}');fbq('track','PageView');`}
          </Script>
          <noscript>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              height="1"
              width="1"
              alt=""
              style={{ display: "none" }}
              src={`https://www.facebook.com/tr?id=${pixel}&ev=PageView&noscript=1`}
            />
          </noscript>
        </>
      ) : null}

      {gtagId ? (
        <>
          <Script
            id="gtag-src"
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${gtagId}`}
          />
          <Script id="gtag-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];
function gtag(){dataLayer.push(arguments);}
window.gtag=window.gtag||gtag;
gtag('js', new Date());
${ga4 ? `gtag('config','${ga4}');` : ""}
${ads ? `gtag('config','${ads}');` : ""}`}
          </Script>
        </>
      ) : null}
    </>
  );
}

/* ------------------------------------------------------------------------ */
/* Eventos                                                                   */
/* ------------------------------------------------------------------------ */

type Fbq = (...args: unknown[]) => void;
type Gtag = (...args: unknown[]) => void;

declare global {
  interface Window {
    fbq?: Fbq;
    gtag?: Gtag;
    dataLayer?: unknown[];
    __carbudAds?: { id: string; lead: string | null; sale: string | null };
  }
}

/**
 * Dispara o evento em quem estiver na página.
 *
 * Não sabe quais conectores existem, e não precisa saber: chama quem
 * respondeu ao carregamento. Assim a ficha do veículo e o formulário não
 * carregam configuração nenhuma, e um site que só usa GTM continua recebendo
 * o evento pelo dataLayer.
 */
export function trackBrowserEvent(
  name: "view_item" | "generate_lead" | "purchase",
  payload: {
    eventId?: string;
    value?: number | null;
    itemId?: string | null;
    itemName?: string | null;
    adsLabel?: string | null;
    adsId?: string | null;
  } = {},
) {
  if (typeof window === "undefined") return;

  const metaName =
    name === "view_item" ? "ViewContent" : name === "generate_lead" ? "Lead" : "Purchase";

  const money =
    payload.value != null ? { value: Number(payload.value.toFixed(2)), currency: "BRL" } : {};

  /*
   * O rótulo da conversão vem do global quando quem chamou não passou um: é
   * o que permite o formulário disparar conversão do Google Ads sem carregar
   * configuração nenhuma.
   */
  const adsId = payload.adsId ?? window.__carbudAds?.id ?? null;
  const adsLabel =
    payload.adsLabel ??
    (name === "generate_lead"
      ? window.__carbudAds?.lead
      : name === "purchase"
        ? window.__carbudAds?.sale
        : null) ??
    null;

  try {
    window.fbq?.(
      "track",
      metaName,
      {
        ...money,
        ...(payload.itemId ? { content_ids: [payload.itemId], content_type: "vehicle" } : {}),
        ...(payload.itemName ? { content_name: payload.itemName } : {}),
      },
      // o mesmo id que o servidor vai mandar: é o que evita contar duas vezes
      payload.eventId ? { eventID: payload.eventId } : undefined,
    );

    window.gtag?.("event", name, {
      ...money,
      ...(payload.itemId
        ? { items: [{ item_id: payload.itemId, item_name: payload.itemName ?? undefined }] }
        : {}),
    });

    // conversão do Google Ads: só com o rótulo daquela conversão
    if (adsId && adsLabel) {
      window.gtag?.("event", "conversion", {
        send_to: `${adsId}/${adsLabel}`,
        ...money,
        ...(payload.eventId ? { transaction_id: payload.eventId } : {}),
      });
    }

    // quem usa GTM monta as próprias tags a partir daqui
    window.dataLayer?.push({ event: `carbud_${name}`, ...money, item_id: payload.itemId ?? null });
  } catch {
    // medição nunca pode quebrar a página de quem está comprando um carro
  }
}

/** Dispara uma vez quando a ficha do veículo abre. */
export function ViewItem({
  vehicleId,
  vehicleName,
  value,
}: {
  vehicleId: string;
  vehicleName: string;
  value?: number | null;
}) {
  useEffect(() => {
    trackBrowserEvent("view_item", { itemId: vehicleId, itemName: vehicleName, value });
  }, [vehicleId, vehicleName, value]);

  return null;
}

/* ------------------------------------------------------------------------ */
/* O que o navegador já sabe e o servidor não                                */
/* ------------------------------------------------------------------------ */

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Os identificadores que viajam junto com o lead.
 *
 * `_fbp`/`_fbc` são do pixel da Meta e `_ga` é do Google. São eles que ligam
 * a conversão à campanha que trouxe a visita — sem eles, o evento entra como
 * se a pessoa tivesse aparecido do nada, e o anúncio não recebe o crédito.
 *
 * O `_ga` vem como "GA1.1.123.456"; o que o Measurement Protocol quer é só o
 * "123.456" do fim.
 */
export function readTrackingContext(eventId: string) {
  const ga = readCookie("_ga");
  const parts = ga?.split(".") ?? [];

  return {
    eventId,
    fbp: readCookie("_fbp") ?? undefined,
    fbc: readCookie("_fbc") ?? undefined,
    gaClientId: parts.length >= 4 ? parts.slice(-2).join(".") : undefined,
    pageUrl: typeof window !== "undefined" ? window.location.href.slice(0, 500) : undefined,
  };
}

/** Id do evento desta conversão, compartilhado com o envio do servidor. */
export function newBrowserEventId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `lead-${crypto.randomUUID()}`;
  return `lead-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
