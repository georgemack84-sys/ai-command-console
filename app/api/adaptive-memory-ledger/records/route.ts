import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireAdaptiveMemoryLedgerUser, sectionRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireAdaptiveMemoryLedgerUser();
    return apiSuccess(await sectionRequest(request, "ledger_records"));
  } catch (error) {
    return apiError(error, "Unable to retrieve adaptive memory ledger records.");
  }
}
