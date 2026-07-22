import { apiError, apiSuccess } from "@/src/server/api/response";
import { dashboardRequest, requirePersistentIntelligenceUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requirePersistentIntelligenceUser();
    return apiSuccess(await dashboardRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect persistent intelligence foundation.");
  }
}

export async function POST(request: Request) {
  try {
    await requirePersistentIntelligenceUser();
    return apiSuccess(await dashboardRequest(request));
  } catch (error) {
    return apiError(error, "Unable to build persistent intelligence foundation.");
  }
}
