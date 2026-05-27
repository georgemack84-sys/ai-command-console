import fs from "node:fs";
import path from "node:path";

import { STARTUP_ERROR_CODES } from "./startupErrorCodes";
import { formatStartupFailure } from "./startupFailureFormatter";

function listExpectedMigrations(migrationsDir = path.join(process.cwd(), "prisma", "migrations")) {
  if (!fs.existsSync(migrationsDir)) {
    return [];
  }
  return fs.readdirSync(migrationsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

export async function assessMigrationReadiness({
  environment,
  migrationState,
}: {
  environment: string;
  migrationState?: {
    expectedMigrations: string[];
    appliedMigrations: string[];
    schemaCompatible: boolean;
  };
}) {
  const state = migrationState || (() => {
    const expectedMigrations = listExpectedMigrations();
    return {
      expectedMigrations,
      appliedMigrations: expectedMigrations,
      schemaCompatible: true,
    };
  })();

  const pending = state.expectedMigrations.filter((migration) => !state.appliedMigrations.includes(migration));
  if (!state.schemaCompatible || (environment === "production" && pending.length > 0)) {
    return formatStartupFailure(STARTUP_ERROR_CODES.STARTUP_MIGRATION_INCOMPATIBLE, "Migration readiness failed.", {
      pending,
      schemaCompatible: state.schemaCompatible,
    });
  }

  return {
    ok: true as const,
    pending,
    schemaCompatible: state.schemaCompatible,
  };
}
