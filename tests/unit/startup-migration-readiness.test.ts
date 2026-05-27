import { describe, expect, it } from "vitest";

import { assessMigrationReadiness } from "@/services/startup/migrationReadiness";

describe("startup migration readiness", () => {
  it("blocks incompatible schema", async () => {
    const result = await assessMigrationReadiness({
      environment: "production",
      migrationState: {
        expectedMigrations: ["001", "002"],
        appliedMigrations: ["001"],
        schemaCompatible: false,
      },
    });

    expect(result.ok).toBe(false);
    expect(result.error.code).toBe("STARTUP_MIGRATION_INCOMPATIBLE");
  });

  it("blocks pending migrations in production", async () => {
    const result = await assessMigrationReadiness({
      environment: "production",
      migrationState: {
        expectedMigrations: ["001", "002"],
        appliedMigrations: ["001"],
        schemaCompatible: true,
      },
    });

    expect(result.ok).toBe(false);
    expect(result.error.code).toBe("STARTUP_MIGRATION_INCOMPATIBLE");
  });
});
