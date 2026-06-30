import { apiError, apiSuccess } from "@/src/server/api/response";
import { hashGovernanceRiskCertificationRequest, requireGovernanceRiskCertificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceRiskCertificationUser();
    return apiSuccess(await hashGovernanceRiskCertificationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to hash Governance Risk Certification.");
  }
}
