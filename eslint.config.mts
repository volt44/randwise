import js from "@eslint/js";
import eslint from "@eslint/js";
import eslintPluginPrettier from 'eslint-plugin-prettier/recommended';
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import json from "@eslint/json";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig(
  globalIgnores([
    '**/dist/',
    '**/build/',
    '**/cdk.out/',
    '**/.lighthouseci/',
    '**/.aws-sam/',
    '**/coverage/',
    '**/node_modules/',
  ]),
  eslint.configs.recommended,
  [
    { files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"], plugins: { js }, extends: ["js/recommended"], languageOptions: { globals: globals.browser } },
    tseslint.configs.recommended,
    pluginReact.configs.flat.recommended,
    eslintPluginPrettier,
    { files: ["**/*.json"], plugins: { json }, language: "json/json", extends: ["json/recommended"] },
  ]);
