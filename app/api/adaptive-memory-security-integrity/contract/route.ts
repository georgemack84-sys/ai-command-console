import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireAdaptiveMemorySecurityUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdaptiveMemorySecurityUser();
    return apiSuccess(contractResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve adaptive memory security contract.");
  }
}
