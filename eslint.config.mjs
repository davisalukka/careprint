import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig([
  globalIgnores(["dist/**"]),
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  {
    // Node test runner files: no-undef needs the runtime globals they use.
    files: ["tests/**/*.mjs"],
    languageOptions: {
      globals: { URL: "readonly", console: "readonly", process: "readonly" },
    },
  },
]);
