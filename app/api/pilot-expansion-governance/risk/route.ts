import { requirePilotExpansionGovernanceUser, riskRequest } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requirePilotExpansionGovernanceUser(); return apiSuccess(await riskRequest()); } catch (error) { return apiError(error, "Unable to load Pilot Expansion Governance risk assessment."); } }
export async function POST(request: Request) { try { await requirePilotExpansionGovernanceUser(); return apiSuccess(await riskRequest(request)); } catch (error) { return apiError(error, "Unable to load Pilot Expansion Governance risk assessment."); } }
