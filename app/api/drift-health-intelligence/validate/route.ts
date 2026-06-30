import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireDriftHealthIntelligenceUser, validateDriftHealthRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireDriftHealthIntelligenceUser();
    return apiSuccess(await validateDriftHealthRequest(request));
  } catch (error) {
    return apiError(error, "Unable to validate Drift & Health Intelligence.");
  }
}
