import { lineageRequest, requirePilotExpansionGovernanceUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requirePilotExpansionGovernanceUser(); return apiSuccess(await lineageRequest()); } catch (error) { return apiError(error, "Unable to load Pilot Expansion Governance lineage."); } }
export async function POST(request: Request) { try { await requirePilotExpansionGovernanceUser(); return apiSuccess(await lineageRequest(request)); } catch (error) { return apiError(error, "Unable to load Pilot Expansion Governance lineage."); } }
