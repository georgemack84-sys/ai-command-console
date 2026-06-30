import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireDriftIntelligenceUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireDriftIntelligenceUser();
    return apiSuccess(contractResponse());
  } catch (error) {
    return apiError(error, "Unable to load drift intelligence contract.");
  }
}
