import eslintPluginReact from "eslint-plugin-react";
import eslintPluginImport from "eslint-plugin-import";
import eslintPluginPrettier from "eslint-plugin-prettier";
import typescriptEslintPlugin from "@typescript-eslint/eslint-plugin";
import typescriptEslintParser from "@typescript-eslint/parser";
import noConsoleUsageEslintPlugin from "./eslint-plugins/no-console-usage.js";

export default [
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      ".next/**",
      "packages/shortest/node_modules/**",
      "packages/shortest/dist/**",
      "**/*.d.ts",
    ],
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: typescriptEslintParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    plugins: {
      "@typescript-eslint": typescriptEslintPlugin,
      react: eslintPluginReact,
      import: eslintPluginImport,
      prettier: eslintPluginPrettier,
    },
    rules: {
      "react/react-in-jsx-scope": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
      "import/order": ["error", { alphabetize: { order: "asc" } }],
      "prettier/prettier": "error",
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
  ...noConsoleUsageEslintPlugin.configs.recommended,
];
