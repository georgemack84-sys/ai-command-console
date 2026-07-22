import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectOverrideRequest, requireOverrideAnalysisUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireOverrideAnalysisUser();
    return apiSuccess(await inspectOverrideRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect override analysis.");
  }
}

export async function POST(request: Request) {
  try {
    await requireOverrideAnalysisUser();
    return apiSuccess(await inspectOverrideRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect override analysis.");
  }
}
