import { apiError, apiSuccess } from "@/src/server/api/response";
import { getGovernanceIdentitySurfaceRequest, requireGovernanceIntelligenceUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireGovernanceIntelligenceUser();
    return apiSuccess(await getGovernanceIdentitySurfaceRequest());
  } catch (error) {
    return apiError(error, "Unable to load Governance Intelligence identity surface.");
  }
}

export async function POST(request: Request) {
  try {
    await requireGovernanceIntelligenceUser();
    return apiSuccess(await getGovernanceIdentitySurfaceRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect Governance Intelligence identity surface.");
  }
}
