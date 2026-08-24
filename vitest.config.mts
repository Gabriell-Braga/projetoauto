import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // as suítes cobrem lógica pura: regras de cobrança, RBAC, senha e validação.
    // Nada que dependa de binding do Cloudflare entra aqui.
    passWithNoTests: false,
  },
});
