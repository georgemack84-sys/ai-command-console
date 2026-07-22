import { apiError, apiSuccess } from "@/src/server/api/response";
import { missionRequest, requireRiskDriftUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRiskDriftUser();
    return apiSuccess(await missionRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve mission risk drift.");
  }
}
