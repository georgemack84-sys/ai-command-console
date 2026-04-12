import { Prisma } from "@prisma/client";
import { AppError } from "@/src/server/api/errors";

function getMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function isDatabaseConnectionMessage(message: string) {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("can't reach database server") ||
    normalized.includes("environment variable not found: database_url") ||
    normalized.includes("failed to connect to the database") ||
    normalized.includes("can't connect to mysql server") ||
    normalized.includes("connection refused")
  );
}

export function normalizeDatabaseError(error: unknown) {
  if (error instanceof AppError) {
    return error;
  }

  if (
    error instanceof Prisma.PrismaClientInitializationError ||
    error instanceof Prisma.PrismaClientRustPanicError
  ) {
    return new AppError(503, "database_unavailable", "Database is unavailable. Start Postgres and try again.");
  }

  const message = getMessage(error);
  if (isDatabaseConnectionMessage(message)) {
    return new AppError(503, "database_unavailable", "Database is unavailable. Start Postgres and try again.");
  }

  return error;
}
