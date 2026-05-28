import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { isAppError } from "@/src/server/api/errors";
import { normalizeDatabaseError } from "@/src/server/db/errors";
import { logger } from "@/src/server/observability/logger";
import { captureException } from "@/src/server/observability/sentry";

export function apiSuccess<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init);
}

export function apiError(error: unknown, fallbackMessage = "Unexpected server error.") {
  const normalizedError = normalizeDatabaseError(error);

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "validation_error",
          message: "Invalid request payload.",
          details: error.flatten(),
        },
      },
      { status: 400 },
    );
  }

  if (isAppError(normalizedError)) {
    if (normalizedError.status >= 500) {
      captureException(normalizedError, { code: normalizedError.code });
    }
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: normalizedError.code,
          message: normalizedError.message,
          details: normalizedError.details,
        },
      },
      { status: normalizedError.status },
    );
  }

  logger.error("Unhandled route error", {
    message: normalizedError instanceof Error ? normalizedError.message : String(normalizedError),
  });
  captureException(normalizedError);

  return NextResponse.json(
    {
      ok: false,
      error: {
        code: "internal_error",
        message: fallbackMessage,
      },
    },
    { status: 500 },
  );
}
