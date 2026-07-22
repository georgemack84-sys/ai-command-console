import { contractResponse, requirePilotScopeEnrollmentUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requirePilotScopeEnrollmentUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to load Pilot Scope Enrollment contract."); } }
