import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireAdaptiveMemoryUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdaptiveMemoryUser();
    return apiSuccess(contractResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve adaptive memory foundation contract.");
  }
}
