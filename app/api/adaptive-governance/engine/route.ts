import { engineRequest, requireAdaptiveGovernanceUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/responses";

export async function GET() { try { await requireAdaptiveGovernanceUser(); return apiSuccess(await engineRequest()); } catch (error) { return apiError(error, "Unable to read adaptive governance engine."); } }
export async function POST(request: Request) { try { await requireAdaptiveGovernanceUser(); return apiSuccess(await engineRequest(request)); } catch (error) { return apiError(error, "Unable to read adaptive governance engine."); } }
