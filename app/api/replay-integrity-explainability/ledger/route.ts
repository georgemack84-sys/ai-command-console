import { apiError, apiSuccess } from "@/src/server/api/response";
import { ledgerRequest, requireReplayIntegrityExplainabilityUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireReplayIntegrityExplainabilityUser(); return apiSuccess(await ledgerRequest()); } catch (error) { return apiError(error, "Unable to load replay ledger."); } }
export async function POST(request: Request) { try { await requireReplayIntegrityExplainabilityUser(); return apiSuccess(await ledgerRequest(request)); } catch (error) { return apiError(error, "Unable to load replay ledger."); } }
