import { apiError, apiSuccess } from "@/src/server/api/response";
import { evidenceTraceRequest, requireHealthExplainabilityUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireHealthExplainabilityUser();
    return apiSuccess(await evidenceTraceRequest(request));
  } catch (error) {
    return apiError(error, "Unable to load health evidence trace.");
  }
}
