import { requirePilotGovernanceUser, resultRequest } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requirePilotGovernanceUser(); return apiSuccess(await resultRequest()); } catch (error) { return apiError(error, "Unable to run Pilot Governance Foundation."); } }
export async function POST(request: Request) { try { await requirePilotGovernanceUser(); return apiSuccess(await resultRequest(request)); } catch (error) { return apiError(error, "Unable to run Pilot Governance Foundation."); } }
