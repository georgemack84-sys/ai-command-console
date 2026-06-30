import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireGovernanceIntelligenceUser, runGovernanceFoundationCertificationRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireGovernanceIntelligenceUser();
    return apiSuccess(await runGovernanceFoundationCertificationRequest());
  } catch (error) {
    return apiError(error, "Unable to load Governance Intelligence foundation certification.");
  }
}

export async function POST(request: Request) {
  try {
    await requireGovernanceIntelligenceUser();
    return apiSuccess(await runGovernanceFoundationCertificationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to run Governance Intelligence foundation certification.");
  }
}
