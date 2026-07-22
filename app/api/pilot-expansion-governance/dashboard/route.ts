import { dashboardRequest, requirePilotExpansionGovernanceUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requirePilotExpansionGovernanceUser(); return apiSuccess(await dashboardRequest()); } catch (error) { return apiError(error, "Unable to load Pilot Expansion Governance dashboard."); } }
export async function POST(request: Request) { try { await requirePilotExpansionGovernanceUser(); return apiSuccess(await dashboardRequest(request)); } catch (error) { return apiError(error, "Unable to load Pilot Expansion Governance dashboard."); } }
