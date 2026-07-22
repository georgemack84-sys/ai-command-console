import { apiError, apiSuccess } from "@/src/server/api/response";
import { analyzeRequest, requireStrategicFailureUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireStrategicFailureUser();
    return apiSuccess(await analyzeRequest(request));
  } catch (error) {
    return apiError(error, "Unable to analyze strategic failures.");
  }
}
