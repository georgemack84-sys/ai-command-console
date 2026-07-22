import { certificationRequest, requirePilotScopeEnrollmentUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requirePilotScopeEnrollmentUser(); return apiSuccess(await certificationRequest()); } catch (error) { return apiError(error, "Unable to load Pilot Scope Enrollment certification."); } }
export async function POST(request: Request) { try { await requirePilotScopeEnrollmentUser(); return apiSuccess(await certificationRequest(request)); } catch (error) { return apiError(error, "Unable to load Pilot Scope Enrollment certification."); } }
