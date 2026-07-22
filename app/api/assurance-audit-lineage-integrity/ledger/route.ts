import { apiError, apiSuccess } from "@/src/server/api/response";
import { ledgerRequest, requireAssuranceAuditUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireAssuranceAuditUser(); return apiSuccess(await ledgerRequest()); } catch (error) { return apiError(error, "Unable to retrieve assurance audit ledger."); } }
export async function POST(request: Request) { try { await requireAssuranceAuditUser(); return apiSuccess(await ledgerRequest(request)); } catch (error) { return apiError(error, "Unable to retrieve assurance audit ledger."); } }
