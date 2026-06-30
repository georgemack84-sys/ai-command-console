import { apiError, apiSuccess } from "@/src/server/api/response";
import { readIntegrityAuditEvent, requireIntegrityViewerUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireIntegrityViewerUser();
    return apiSuccess(await readIntegrityAuditEvent(request), { status: 201 });
  } catch (error) {
    return apiError(error, "Unable to record Integrity Status Viewer audit event.");
  }
}
