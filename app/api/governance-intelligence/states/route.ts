import { apiError, apiSuccess } from "@/src/server/api/response";
import { getGovernanceStateSurfaceRequest, requireGovernanceIntelligenceUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireGovernanceIntelligenceUser();
    return apiSuccess(await getGovernanceStateSurfaceRequest());
  } catch (error) {
    return apiError(error, "Unable to load Governance Intelligence state surface.");
  }
}

export async function POST(request: Request) {
  try {
    await requireGovernanceIntelligenceUser();
    return apiSuccess(await getGovernanceStateSurfaceRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect Governance Intelligence state surface.");
  }
}
