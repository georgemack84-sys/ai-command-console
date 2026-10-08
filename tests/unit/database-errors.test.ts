import { Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { normalizeDatabaseError } from "@/src/server/db/errors";

describe("normalizeDatabaseError", () => {
  it("reports a missing Prisma table as a migration-required service error", () => {
    const error = new Prisma.PrismaClientKnownRequestError("The table does not exist.", {
      code: "P2021",
      clientVersion: "test",
    });

    expect(normalizeDatabaseError(error)).toMatchObject({
      status: 503,
      code: "database_schema_outdated",
      message: "Database schema is missing a required migration. Apply the pending Prisma migrations and try again.",
    });
  });

  it("reports a missing Prisma column as a migration-required service error", () => {
    const error = new Prisma.PrismaClientKnownRequestError("The column does not exist.", {
      code: "P2022",
      clientVersion: "test",
    });

    expect(normalizeDatabaseError(error)).toMatchObject({
      status: 503,
      code: "database_schema_outdated",
    });
  });
});
