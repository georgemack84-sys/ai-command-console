import { apiError, apiSuccess } from "@/src/server/api/response";
import { ledgerRequest, requireProductionReplayUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireProductionReplayUser(); return apiSuccess(await ledgerRequest()); } catch (error) { return apiError(error, "Unable to load production replay ledger."); } }
export async function POST(request: Request) { try { await requireProductionReplayUser(); return apiSuccess(await ledgerRequest(request)); } catch (error) { return apiError(error, "Unable to load production replay ledger."); } }
