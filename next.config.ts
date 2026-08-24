import type { NextConfig } from "next";

/**
 * O Webflow Cloud injeta BASE_URL/ASSETS_PREFIX no build a partir do mount
 * path do app (ex.: "/app"). BASE_URL não é NEXT_PUBLIC, então não chega ao
 * bundle do cliente — e `fetch()` manual e `<img src>` cru precisam do prefixo.
 * Repassamos o valor como NEXT_PUBLIC_BASE_PATH para não depender de ninguém
 * lembrar de cadastrar a variável na mão.
 */
const basePath = process.env.BASE_URL || "";

const nextConfig: NextConfig = {
  ...(basePath && {
    basePath,
    assetPrefix: process.env.ASSETS_PREFIX || basePath,
  }),
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;

// Enable getCloudflareContext() in `next dev`
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
