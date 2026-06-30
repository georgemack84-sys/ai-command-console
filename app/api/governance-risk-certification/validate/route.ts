import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireGovernanceRiskCertificationUser, validateGovernanceRiskCertificationRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceRiskCertificationUser();
    return apiSuccess(await validateGovernanceRiskCertificationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to validate Governance Risk Certification.");
  }
}
