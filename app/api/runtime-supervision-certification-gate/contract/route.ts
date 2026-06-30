import { apiError, apiSuccess } from "@/src/server/api/response";
import { getRuntimeSupervisionCertificationContractResponse, requireRuntimeSupervisionCertificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireRuntimeSupervisionCertificationUser();
    return apiSuccess(getRuntimeSupervisionCertificationContractResponse());
  } catch (error) {
    return apiError(error, "Unable to load Runtime Supervision Certification Gate contract.");
  }
}
