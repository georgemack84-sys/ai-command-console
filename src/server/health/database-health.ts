import { prisma } from "@/src/server/db/prisma";

const DATABASE_HEALTH_TIMEOUT_MS = 1500;

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export async function checkDatabaseHealth() {
  try {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    try {
      await Promise.race([
        prisma.$queryRaw`SELECT 1`,
        new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error("Database health check timed out.")), DATABASE_HEALTH_TIMEOUT_MS);
        }),
      ]);
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
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
