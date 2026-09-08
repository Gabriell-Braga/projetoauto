import Script from "next/script";

/**
 * Google Tag Manager por revenda.
 * O código vem do painel: a revenda usa o próprio; se não tiver, herda o
 * definido pelo super-admin.
 */
export function GoogleTagManager({ containerId }: { containerId: string | null }) {
  if (!containerId || !/^GTM-[A-Z0-9]{4,10}$/i.test(containerId)) return null;

  const id = containerId.toUpperCase();

  return (
    <>
      <Script id={`gtm-${id}`} strategy="afterInteractive">
        {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${id}');`}
      </Script>
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${id}`}
          height="0"
          width="0"
          style={{ display: "none", visibility: "hidden" }}
          title="Google Tag Manager"
        />
      </noscript>
    </>
  );
}
