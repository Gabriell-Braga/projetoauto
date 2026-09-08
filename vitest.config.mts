import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    // `scripts/` entra porque os utilitarios de linha de comando tambem tem
    // logica que erra calado — o parsing da URL do Figma e um deles.
    include: ["src/**/*.test.ts", "scripts/**/*.test.ts"],
    // as suítes cobrem lógica pura: regras de cobrança, RBAC, senha e validação.
    // Nada que dependa de binding do Cloudflare entra aqui.
    passWithNoTests: false,
  },
});
