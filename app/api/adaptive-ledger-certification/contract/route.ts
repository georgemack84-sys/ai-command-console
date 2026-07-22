import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireAdaptiveLedgerUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireAdaptiveLedgerUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to retrieve adaptive ledger certification contract."); } }
