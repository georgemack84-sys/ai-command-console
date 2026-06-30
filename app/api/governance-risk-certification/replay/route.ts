import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayGovernanceRiskCertificationRequest, requireGovernanceRiskCertificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceRiskCertificationUser();
    return apiSuccess(await replayGovernanceRiskCertificationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to replay Governance Risk Certification.");
  }
}
