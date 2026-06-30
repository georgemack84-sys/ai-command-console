import { apiError, apiSuccess } from "@/src/server/api/response";
import { readReplayAuditEvent, requireReplayViewerUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireReplayViewerUser();
    return apiSuccess(await readReplayAuditEvent(request), { status: 201 });
  } catch (error) {
    return apiError(error, "Unable to record Replay Viewer audit event.");
  }
}
