import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireHealthExplainabilityUser, trendInfluenceRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireHealthExplainabilityUser();
    return apiSuccess(await trendInfluenceRequest(request));
  } catch (error) {
    return apiError(error, "Unable to load trend influence explanation.");
  }
}
