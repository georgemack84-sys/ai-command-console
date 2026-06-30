import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireTaskClassificationUser, rulesTaskClassificationResponse } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireTaskClassificationUser();
    return apiSuccess(rulesTaskClassificationResponse());
  } catch (error) {
    return apiError(error, "Unable to load Task Classification rules.");
  }
}
