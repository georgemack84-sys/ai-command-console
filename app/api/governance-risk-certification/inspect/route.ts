import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectGovernanceRiskCertificationRequest, requireGovernanceRiskCertificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireGovernanceRiskCertificationUser();
    return apiSuccess(await inspectGovernanceRiskCertificationRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect Governance Risk Certification.");
  }
}

export async function POST(request: Request) {
  try {
    await requireGovernanceRiskCertificationUser();
    return apiSuccess(await inspectGovernanceRiskCertificationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect Governance Risk Certification.");
  }
}
