import { requirePilotScopeEnrollmentUser, workflowRequest } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requirePilotScopeEnrollmentUser(); return apiSuccess(await workflowRequest()); } catch (error) { return apiError(error, "Unable to load Pilot Scope Enrollment workflow."); } }
export async function POST(request: Request) { try { await requirePilotScopeEnrollmentUser(); return apiSuccess(await workflowRequest(request)); } catch (error) { return apiError(error, "Unable to load Pilot Scope Enrollment workflow."); } }
