import { apiError, apiSuccess } from "@/src/server/api/response";
import { ledgerRequest, requireMemoryLifecycleUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireMemoryLifecycleUser();
    return apiSuccess(await ledgerRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve memory lifecycle ledger.");
  }
}
