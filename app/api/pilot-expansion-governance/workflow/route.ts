import { requirePilotExpansionGovernanceUser, workflowRequest } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requirePilotExpansionGovernanceUser(); return apiSuccess(await workflowRequest()); } catch (error) { return apiError(error, "Unable to load Pilot Expansion Governance workflow."); } }
export async function POST(request: Request) { try { await requirePilotExpansionGovernanceUser(); return apiSuccess(await workflowRequest(request)); } catch (error) { return apiError(error, "Unable to load Pilot Expansion Governance workflow."); } }
