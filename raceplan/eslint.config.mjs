import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  {
    // The engine must stay pure: no clock, no randomness, no React/Next/browser APIs.
    files: ["src/engine/**/*.ts"],
    ignores: ["src/engine/**/*.test.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "MemberExpression[object.name='Date'][property.name='now']",
          message: "Pass `today` in instead.",
        },
        {
          selector: "MemberExpression[object.name='Math'][property.name='random']",
          message: "Engine must be deterministic.",
        },
        {
          selector: "NewExpression[callee.name='Date'][arguments.length=0]",
          message: "Pass `today` in instead.",
        },
      ],
      "no-restricted-globals": ["error", "window", "document", "localStorage", "navigator"],
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            "react",
            "react-dom",
            "next",
            "next/*",
            "next-intl",
            "next-intl/*",
            "@/features/*",
            "@/components/*",
            "@/storage/*",
          ],
        },
      ],
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "playwright-report/**",
    "test-results/**",
  ]),
]);

export default eslintConfig;
