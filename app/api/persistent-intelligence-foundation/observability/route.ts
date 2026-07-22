import { apiError, apiSuccess } from "@/src/server/api/response";
import { observabilityRequest, requirePersistentIntelligenceUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requirePersistentIntelligenceUser();
    return apiSuccess(await observabilityRequest());
  } catch (error) {
    return apiError(error, "Unable to retrieve persistent intelligence observability.");
  }
}

export async function POST(request: Request) {
  try {
    await requirePersistentIntelligenceUser();
    return apiSuccess(await observabilityRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect persistent intelligence observability.");
  }
}
