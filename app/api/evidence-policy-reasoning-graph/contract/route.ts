import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireReasoningGraphUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireReasoningGraphUser();
    return apiSuccess(contractResponse());
  } catch (error) {
    return apiError(error, "Unable to load evidence policy reasoning graph contract.");
  }
}
