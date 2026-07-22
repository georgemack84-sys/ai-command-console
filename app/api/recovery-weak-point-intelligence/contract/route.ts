import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireRecoveryWeakPointUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireRecoveryWeakPointUser();
    return apiSuccess(contractResponse());
  } catch (error) {
    return apiError(error, "Unable to load recovery weak-point contract.");
  }
}
