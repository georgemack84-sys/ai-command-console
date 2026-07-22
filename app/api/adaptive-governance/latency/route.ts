import { latencyRequest, requireAdaptiveGovernanceUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/responses";

export async function GET() { try { await requireAdaptiveGovernanceUser(); return apiSuccess(await latencyRequest()); } catch (error) { return apiError(error, "Unable to read approval latency."); } }
export async function POST(request: Request) { try { await requireAdaptiveGovernanceUser(); return apiSuccess(await latencyRequest(request)); } catch (error) { return apiError(error, "Unable to read approval latency."); } }
