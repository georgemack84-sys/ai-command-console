import { escalationRequest, requireIncidentExceptionGovernanceUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireIncidentExceptionGovernanceUser(); return apiSuccess(await escalationRequest()); } catch (error) { return apiError(error, "Unable to load Incident Exception Governance escalation."); } }
export async function POST(request: Request) { try { await requireIncidentExceptionGovernanceUser(); return apiSuccess(await escalationRequest(request)); } catch (error) { return apiError(error, "Unable to load Incident Exception Governance escalation."); } }
