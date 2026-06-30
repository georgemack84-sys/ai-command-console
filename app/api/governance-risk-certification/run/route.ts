import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireGovernanceRiskCertificationUser, runGovernanceRiskCertificationRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceRiskCertificationUser();
    return apiSuccess(await runGovernanceRiskCertificationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to run Governance Risk Certification.");
  }
}
