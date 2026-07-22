import { registryRequest, requirePilotExpansionGovernanceUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requirePilotExpansionGovernanceUser(); return apiSuccess(await registryRequest()); } catch (error) { return apiError(error, "Unable to load Pilot Expansion Governance registry."); } }
export async function POST(request: Request) { try { await requirePilotExpansionGovernanceUser(); return apiSuccess(await registryRequest(request)); } catch (error) { return apiError(error, "Unable to load Pilot Expansion Governance registry."); } }
