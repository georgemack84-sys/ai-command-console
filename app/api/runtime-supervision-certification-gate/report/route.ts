import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireRuntimeSupervisionCertificationUser, runtimeSupervisionCertificationReportRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRuntimeSupervisionCertificationUser();
    return apiSuccess(await runtimeSupervisionCertificationReportRequest(request));
  } catch (error) {
    return apiError(error, "Unable to generate Runtime Supervision certification report.");
  }
}
