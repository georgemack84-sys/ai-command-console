import { authorityRequest, requirePilotGovernanceUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requirePilotGovernanceUser(); return apiSuccess(await authorityRequest()); } catch (error) { return apiError(error, "Unable to load Pilot Governance authority model."); } }
export async function POST(request: Request) { try { await requirePilotGovernanceUser(); return apiSuccess(await authorityRequest(request)); } catch (error) { return apiError(error, "Unable to load Pilot Governance authority model."); } }
