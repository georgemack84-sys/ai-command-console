import { qualificationRequest, requirePilotExpansionGovernanceUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requirePilotExpansionGovernanceUser(); return apiSuccess(await qualificationRequest()); } catch (error) { return apiError(error, "Unable to load Pilot Expansion Governance qualification."); } }
export async function POST(request: Request) { try { await requirePilotExpansionGovernanceUser(); return apiSuccess(await qualificationRequest(request)); } catch (error) { return apiError(error, "Unable to load Pilot Expansion Governance qualification."); } }
