import { apiError, apiSuccess } from "@/src/server/api/response";
import { ledgerRequest, requireScenarioIntelligenceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireScenarioIntelligenceUser(); return apiSuccess(await ledgerRequest()); } catch (error) { return apiError(error, "Unable to inspect scenario ledger."); } }
export async function POST(request: Request) { try { await requireScenarioIntelligenceUser(); return apiSuccess(await ledgerRequest(request)); } catch (error) { return apiError(error, "Unable to inspect scenario ledger."); } }
