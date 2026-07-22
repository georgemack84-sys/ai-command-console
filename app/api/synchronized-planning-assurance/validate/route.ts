import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireSynchronizedPlanningUser, validateRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireSynchronizedPlanningUser();
    return apiSuccess(await validateRequest(request));
  } catch (error) {
    return apiError(error, "Unable to validate synchronized planning assurance.");
  }
}
