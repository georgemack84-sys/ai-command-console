import { apiError, apiSuccess } from "@/src/server/api/response";
import { reportDelegationCertificationRequest, requireDelegationCertificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireDelegationCertificationUser();
    return apiSuccess((await reportDelegationCertificationRequest(request)).certification_evidence);
  } catch (error) {
    return apiError(error, "Unable to load Delegation Certification evidence.");
  }
}
