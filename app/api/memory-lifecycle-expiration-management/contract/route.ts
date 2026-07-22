import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireMemoryLifecycleUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireMemoryLifecycleUser();
    return apiSuccess(contractResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve memory lifecycle contract.");
  }
}
