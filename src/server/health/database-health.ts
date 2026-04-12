import { prisma } from "@/src/server/db/prisma";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export async function checkDatabaseHealth() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      ok: true,
      status: "ok" as const,
      details: null,
    };
  } catch (error) {
    return {
      ok: false,
      status: "unavailable" as const,
      details: getErrorMessage(error),
    };
  }
}
