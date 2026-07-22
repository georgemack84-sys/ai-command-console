import { apiError, apiSuccess } from "@/src/server/api/response";
import { ledgerRequest, requireHistoricalReasoningUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() { try { await requireHistoricalReasoningUser(); return apiSuccess(await ledgerRequest()); } catch (error) { return apiError(error, "Unable to retrieve historical reasoning ledger."); } }
export async function POST(request: Request) { try { await requireHistoricalReasoningUser(); return apiSuccess(await ledgerRequest(request)); } catch (error) { return apiError(error, "Unable to inspect historical reasoning ledger."); } }
