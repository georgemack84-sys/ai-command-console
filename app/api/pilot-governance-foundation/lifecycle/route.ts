import { lifecycleRequest, requirePilotGovernanceUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requirePilotGovernanceUser(); return apiSuccess(await lifecycleRequest()); } catch (error) { return apiError(error, "Unable to load Pilot Governance lifecycle."); } }
export async function POST(request: Request) { try { await requirePilotGovernanceUser(); return apiSuccess(await lifecycleRequest(request)); } catch (error) { return apiError(error, "Unable to load Pilot Governance lifecycle."); } }
