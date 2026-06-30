import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireRuntimeSupervisionCertificationUser, runtimeSupervisionCertificationEvidenceRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRuntimeSupervisionCertificationUser();
    return apiSuccess(await runtimeSupervisionCertificationEvidenceRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve Runtime Supervision certification evidence.");
  }
}
