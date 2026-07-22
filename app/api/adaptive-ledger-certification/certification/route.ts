import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireAdaptiveLedgerUser, sectionRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function POST(request: Request) { try { await requireAdaptiveLedgerUser(); return apiSuccess(await sectionRequest(request, "record")); } catch (error) { return apiError(error, "Unable to retrieve adaptive ledger certification record."); } }
