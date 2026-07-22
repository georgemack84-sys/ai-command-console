import { certificationRequest, requirePilotReadinessAssessmentUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requirePilotReadinessAssessmentUser(); return apiSuccess(await certificationRequest()); } catch (error) { return apiError(error, "Unable to load Pilot Readiness certification."); } }
export async function POST(request: Request) { try { await requirePilotReadinessAssessmentUser(); return apiSuccess(await certificationRequest(request)); } catch (error) { return apiError(error, "Unable to load Pilot Readiness certification."); } }
