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
    "!services/learningAdvisory.js",
    "tools/**",
    "coverage/**",
    "cli.js",
    "server.js",
    "toolRouter.js",
    "*.txt",
  ]),
  {
    files: ["services/learningAdvisory.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "no-restricted-modules": [
        "error",
        {
          paths: [
            "./executionEngine",
            "./toolRouter",
            "./planner",
            "./runtimeControl",
            "./stepController",
          ],
        },
      ],
    },
  },
  {
    files: ["stores/**/*.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  {
    files: ["tests/**/*.{ts,tsx}", "tests/**/*.mts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  {
    files: [
      "prisma/seed.ts",
      "src/server/services/control-center-service.ts",
      "src/server/services/policy-governance-service.ts",
      "src/server/services/terminal-governance-compat-service.ts",
      "types/recoveryDemoScenario.ts",
      "types/recoveryEvidence.ts",
      "types/recoveryTimeline.ts",
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  {
    files: ["tests/job-queue.test.cjs"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
]);

export default eslintConfig;
