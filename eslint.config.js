import js from "@eslint/js";
import globals from "globals";
import json from "@eslint/json";
import css from "@eslint/css";
import { defineConfig, globalIgnores } from "eslint/config";

/** https://eslint.org/docs/latest/use/configure/rules */
export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: { globals: {...globals.browser, ...globals.node} },
    rules: {
      "no-unused-vars": "warn"
    }
  },
  { files: ["**/*.json"], plugins: { json }, language: "json/json", extends: ["json/recommended"] },
  { files: ["**/*.css"], plugins: { css }, language: "css/css", extends: ["css/recommended"] },
  globalIgnores(['package-lock.json']),
]);
