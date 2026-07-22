import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireAdaptiveMemoryStoreUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdaptiveMemoryStoreUser();
    return apiSuccess(contractResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve adaptive memory store contract.");
  }
}
