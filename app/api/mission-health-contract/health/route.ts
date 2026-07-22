import { apiError, apiSuccess } from "@/src/server/api/response";
import { healthRequest, requireMissionHealthUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireMissionHealthUser();
    return apiSuccess(await healthRequest(request));
  } catch (error) {
    return apiError(error, "Unable to create mission health record.");
  }
}
