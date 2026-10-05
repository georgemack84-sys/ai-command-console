import { AppError } from "@/src/server/api/errors";

/** Reads JSON once with an enforced byte budget, even when Content-Length is absent. */
export async function readJsonWithinLimit(request: Request, maxBytes: number) {
  const declared = Number(request.headers.get("content-length") || 0);
  if (declared > maxBytes) throw new AppError(413, "request_payload_too_large", "Request payload exceeds the allowed size.");
  const text = await request.text();
  if (Buffer.byteLength(text, "utf8") > maxBytes) throw new AppError(413, "request_payload_too_large", "Request payload exceeds the allowed size.");
  try { return JSON.parse(text) as unknown; }
  catch { throw new AppError(400, "invalid_json", "Request body must be valid JSON."); }
}
