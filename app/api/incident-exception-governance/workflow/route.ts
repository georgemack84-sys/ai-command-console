import { requireIncidentExceptionGovernanceUser, workflowRequest } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireIncidentExceptionGovernanceUser(); return apiSuccess(await workflowRequest()); } catch (error) { return apiError(error, "Unable to load Incident Exception Governance workflow."); } }
export async function POST(request: Request) { try { await requireIncidentExceptionGovernanceUser(); return apiSuccess(await workflowRequest(request)); } catch (error) { return apiError(error, "Unable to load Incident Exception Governance workflow."); } }
