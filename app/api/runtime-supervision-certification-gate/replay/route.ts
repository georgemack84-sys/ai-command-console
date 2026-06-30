import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireRuntimeSupervisionCertificationUser, runtimeSupervisionCertificationReplayRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRuntimeSupervisionCertificationUser();
    return apiSuccess(await runtimeSupervisionCertificationReplayRequest(request));
  } catch (error) {
    return apiError(error, "Unable to replay Runtime Supervision certification.");
  }
}
