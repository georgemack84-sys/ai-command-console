import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectDriftHealthRequest, requireDriftHealthIntelligenceUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireDriftHealthIntelligenceUser();
    return apiSuccess(await inspectDriftHealthRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect Drift & Health Intelligence.");
  }
}

export async function POST(request: Request) {
  try {
    await requireDriftHealthIntelligenceUser();
    return apiSuccess(await inspectDriftHealthRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect Drift & Health Intelligence.");
  }
}
