import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "**/.next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "backend/**",
    "ai-command-console/**",
    "ReadAR/**",
    "agents/**",
    "config/**",
    "data/**",
    "logs/**",
    "memory/**",
    "plugins/**",
    "scripts/**",
    "services/**",
    "tools/**",
    "cli.js",
    "server.js",
    "toolRouter.js",
    "*.txt",
  ]),
]);

export default eslintConfig;
