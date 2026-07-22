import { recommendationsRequest, requireAdaptiveGovernanceUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/responses";

export async function GET() { try { await requireAdaptiveGovernanceUser(); return apiSuccess(await recommendationsRequest()); } catch (error) { return apiError(error, "Unable to read governance recommendations."); } }
export async function POST(request: Request) { try { await requireAdaptiveGovernanceUser(); return apiSuccess(await recommendationsRequest(request)); } catch (error) { return apiError(error, "Unable to read governance recommendations."); } }
