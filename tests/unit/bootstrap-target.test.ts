import { beforeAll, describe, expect, it } from "vitest";

let parseDatabaseTarget: (databaseUrl: string) => { host: string; port: number; databaseName: string };
let isSafeLocalBootstrapTarget: (target: { host: string; databaseName: string }) => boolean;

describe("bootstrap target safety", () => {
  beforeAll(async () => {
    ({ parseDatabaseTarget, isSafeLocalBootstrapTarget } = await import("../../scripts/lib/bootstrap-target.cjs"));
  });

  it("allows the standard local development database", () => {
    const target = parseDatabaseTarget("postgresql://postgres:postgres@localhost:55432/ai_command_console?schema=public");

    expect(isSafeLocalBootstrapTarget(target)).toBe(true);
  });

  it("rejects shared or non-standard database targets", () => {
    const remoteTarget = parseDatabaseTarget("postgresql://app:secret@db.internal:5432/team_shared?schema=public");
    const wrongDatabaseTarget = parseDatabaseTarget("postgresql://postgres:postgres@localhost:55432/postgres?schema=public");

    expect(isSafeLocalBootstrapTarget(remoteTarget)).toBe(false);
    expect(isSafeLocalBootstrapTarget(wrongDatabaseTarget)).toBe(false);
  });
});
