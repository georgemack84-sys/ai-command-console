import { apiError, apiSuccess } from "@/src/server/api/response";
import { certifyRuntimeSupervisionRequest, requireRuntimeSupervisionCertificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRuntimeSupervisionCertificationUser();
    return apiSuccess(await certifyRuntimeSupervisionRequest(request));
  } catch (error) {
    return apiError(error, "Unable to certify Runtime Supervision.");
  }
}
