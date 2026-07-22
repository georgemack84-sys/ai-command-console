import { requirePilotGovernanceUser, scopeRequest } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requirePilotGovernanceUser(); return apiSuccess(await scopeRequest()); } catch (error) { return apiError(error, "Unable to load Pilot Governance scope."); } }
export async function POST(request: Request) { try { await requirePilotGovernanceUser(); return apiSuccess(await scopeRequest(request)); } catch (error) { return apiError(error, "Unable to load Pilot Governance scope."); } }
