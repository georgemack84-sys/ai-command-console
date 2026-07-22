import { apiError, apiSuccess } from "@/src/server/api/response";
import { ledgerRequest, requireAdaptiveMemoryUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireAdaptiveMemoryUser();
    return apiSuccess(await ledgerRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve adaptive memory foundation ledger.");
  }
}
