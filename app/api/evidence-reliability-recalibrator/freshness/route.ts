import { apiError, apiSuccess } from "@/src/server/api/response";
import { freshnessRequest, requireEvidenceReliabilityUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireEvidenceReliabilityUser();
    return apiSuccess(await freshnessRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve evidence freshness analysis.");
  }
}
