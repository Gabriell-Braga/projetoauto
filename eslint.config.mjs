import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

/**
 * Caixas de diálogo do navegador quebram a identidade do painel: tipografia,
 * cores e botões vêm do sistema operacional, e o rótulo é sempre "OK" e
 * "Cancelar" — que dizem menos do que "Excluir plano". Use useConfirm() de
 * "@/components/ui/confirm" e useToast() de "@/components/ui/toast".
 */
const MESSAGE =
  "Nada de caixa do navegador. Use useConfirm() para confirmar e useToast() para avisar.";

/**
 * A chamada por window é sintaxe, então cai em no-restricted-syntax.
 *
 * Já a chamada solta precisa de no-restricted-globals, que enxerga escopo: um
 * seletor de sintaxe acusaria também a variável local devolvida por
 * useConfirm(), que é justamente o que queremos que as telas usem.
 */
const NATIVE_MEMBER_CALLS = [
  {
    selector:
      'CallExpression > MemberExpression[object.name="window"][property.name=/^(confirm|alert|prompt)$/]',
    message: MESSAGE,
  },
];

const NATIVE_GLOBALS = ["confirm", "alert", "prompt"].map((name) => ({
  name,
  message: MESSAGE,
}));

const eslintConfig = [
  {
    ignores: [
      "**/.next/**",
      "**/.open-next/**",
      "**/node_modules/**",
      "src/db/migrations.generated.ts",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "no-restricted-syntax": ["error", ...NATIVE_MEMBER_CALLS],
      "no-restricted-globals": ["error", ...NATIVE_GLOBALS],
    },
  },
  {
    // o próprio componente de confirmação cita os nomes ao explicar por quê
    files: ["src/components/ui/confirm.tsx"],
    rules: { "no-restricted-syntax": "off", "no-restricted-globals": "off" },
  },
];

export default eslintConfig;
