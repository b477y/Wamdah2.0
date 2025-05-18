import { config } from "@remotion/eslint-config-flat";
import tseslint from "typescript-eslint";

export default [
  ...config,
  {
    files: ["**/*.ts", "**/*.tsx"],
    plugins: {
      "@typescript-eslint": tseslint.plugin,
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];
