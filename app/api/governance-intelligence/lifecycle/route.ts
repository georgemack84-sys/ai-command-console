import { apiError, apiSuccess } from "@/src/server/api/response";
import { getGovernanceLifecycleSurfaceRequest, requireGovernanceIntelligenceUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireGovernanceIntelligenceUser();
    return apiSuccess(await getGovernanceLifecycleSurfaceRequest());
  } catch (error) {
    return apiError(error, "Unable to load Governance Intelligence lifecycle surface.");
  }
}

export async function POST(request: Request) {
  try {
    await requireGovernanceIntelligenceUser();
    return apiSuccess(await getGovernanceLifecycleSurfaceRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect Governance Intelligence lifecycle surface.");
  }
}
