import { requirePilotReadinessAssessmentUser, resultRequest } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requirePilotReadinessAssessmentUser(); return apiSuccess(await resultRequest()); } catch (error) { return apiError(error, "Unable to run Pilot Readiness Assessment."); } }
export async function POST(request: Request) { try { await requirePilotReadinessAssessmentUser(); return apiSuccess(await resultRequest(request)); } catch (error) { return apiError(error, "Unable to run Pilot Readiness Assessment."); } }
