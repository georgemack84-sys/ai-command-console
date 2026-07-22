import { apiError, apiSuccess } from "@/src/server/api/response";
import { defendRequest, requireOptimizationPressureUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireOptimizationPressureUser();
    return apiSuccess(await defendRequest(request));
  } catch (error) {
    return apiError(error, "Unable to defend optimization pressure.");
  }
}
