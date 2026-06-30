import { apiError, apiSuccess } from "@/src/server/api/response";
import { matrixTaskClassificationResponse, requireTaskClassificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireTaskClassificationUser();
    return apiSuccess(matrixTaskClassificationResponse());
  } catch (error) {
    return apiError(error, "Unable to load Task Classification decision matrix.");
  }
}
