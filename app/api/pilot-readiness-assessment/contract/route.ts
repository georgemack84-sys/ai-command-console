import { contractResponse, requirePilotReadinessAssessmentUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requirePilotReadinessAssessmentUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to load Pilot Readiness Assessment contract."); } }
