import { requireAdaptiveGovernanceUser, workloadRequest } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/responses";

export async function GET() { try { await requireAdaptiveGovernanceUser(); return apiSuccess(await workloadRequest()); } catch (error) { return apiError(error, "Unable to read governance workload."); } }
export async function POST(request: Request) { try { await requireAdaptiveGovernanceUser(); return apiSuccess(await workloadRequest(request)); } catch (error) { return apiError(error, "Unable to read governance workload."); } }
