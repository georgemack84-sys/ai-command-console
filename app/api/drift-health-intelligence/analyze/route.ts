import { apiError, apiSuccess } from "@/src/server/api/response";
import { analyzeDriftHealthRequest, requireDriftHealthIntelligenceUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireDriftHealthIntelligenceUser();
    return apiSuccess(await analyzeDriftHealthRequest(request));
  } catch (error) {
    return apiError(error, "Unable to analyze Drift & Health Intelligence.");
  }
}
