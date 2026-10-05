import { env } from "@/src/config/env";
import { AppError } from "@/src/server/api/errors";

/** Protect cookie-authenticated mutations from cross-site form and fetch requests. */
export function requireSameOriginMutation(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) {
    throw new AppError(403, "csrf_origin_required", "A same-origin request is required for this mutation.");
  }

  let requestOrigin: string;
  try {
    requestOrigin = new URL(origin).origin;
  } catch {
    throw new AppError(403, "csrf_origin_invalid", "The request origin is invalid.");
  }

  const appOrigin = new URL(env.NEXT_PUBLIC_APP_URL).origin;
  if (requestOrigin !== appOrigin) {
    throw new AppError(403, "csrf_origin_mismatch", "The request origin is not allowed.");
  }
}
