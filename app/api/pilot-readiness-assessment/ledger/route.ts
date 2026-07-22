import { ledgerRequest, requirePilotReadinessAssessmentUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requirePilotReadinessAssessmentUser(); return apiSuccess(await ledgerRequest()); } catch (error) { return apiError(error, "Unable to load Pilot Readiness ledger."); } }
export async function POST(request: Request) { try { await requirePilotReadinessAssessmentUser(); return apiSuccess(await ledgerRequest(request)); } catch (error) { return apiError(error, "Unable to load Pilot Readiness ledger."); } }
