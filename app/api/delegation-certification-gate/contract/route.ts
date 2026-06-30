import { apiError, apiSuccess } from "@/src/server/api/response";
import { getDelegationCertificationResponse, requireDelegationCertificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireDelegationCertificationUser();
    return apiSuccess(getDelegationCertificationResponse());
  } catch (error) {
    return apiError(error, "Unable to load Delegation Certification Gate contract.");
  }
}
