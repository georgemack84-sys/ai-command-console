import { requireAdaptiveGovernanceUser, resultRequest } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/responses";

export async function GET() { try { await requireAdaptiveGovernanceUser(); return apiSuccess(await resultRequest()); } catch (error) { return apiError(error, "Unable to run Adaptive Governance."); } }
export async function POST(request: Request) { try { await requireAdaptiveGovernanceUser(); return apiSuccess(await resultRequest(request)); } catch (error) { return apiError(error, "Unable to run Adaptive Governance."); } }
