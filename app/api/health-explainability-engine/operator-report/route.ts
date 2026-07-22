import { apiError, apiSuccess } from "@/src/server/api/response";
import { operatorReportRequest, requireHealthExplainabilityUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireHealthExplainabilityUser();
    return apiSuccess(await operatorReportRequest(request));
  } catch (error) {
    return apiError(error, "Unable to load operator health explanation.");
  }
}
