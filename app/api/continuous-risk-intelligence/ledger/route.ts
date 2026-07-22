import { ledgerRequest, requireContinuousRiskIntelligenceUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/responses";

export async function GET() { try { await requireContinuousRiskIntelligenceUser(); return apiSuccess(await ledgerRequest()); } catch (error) { return apiError(error, "Unable to read risk ledger."); } }
export async function POST(request: Request) { try { await requireContinuousRiskIntelligenceUser(); return apiSuccess(await ledgerRequest(request)); } catch (error) { return apiError(error, "Unable to read risk ledger."); } }
