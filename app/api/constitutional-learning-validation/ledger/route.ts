import { apiError, apiSuccess } from "@/src/server/api/response";
import { ledgerRequest, requireConstitutionalLearningValidationUser } from "../core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try { await requireConstitutionalLearningValidationUser(); return apiSuccess(await ledgerRequest(request)); }
  catch (error) { return apiError(error, "Unable to load constitutional learning ledger."); }
}
