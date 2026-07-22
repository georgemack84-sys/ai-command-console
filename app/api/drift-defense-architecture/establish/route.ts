import { apiError, apiSuccess } from "@/src/server/api/response";
import { establishRequest, requireDriftDefenseUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireDriftDefenseUser();
    return apiSuccess(await establishRequest(request));
  } catch (error) {
    return apiError(error, "Unable to establish drift defense architecture.");
  }
}
