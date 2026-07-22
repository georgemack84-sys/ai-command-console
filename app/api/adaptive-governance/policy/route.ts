import { policyRequest, requireAdaptiveGovernanceUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/responses";

export async function GET() { try { await requireAdaptiveGovernanceUser(); return apiSuccess(await policyRequest()); } catch (error) { return apiError(error, "Unable to read policy effectiveness."); } }
export async function POST(request: Request) { try { await requireAdaptiveGovernanceUser(); return apiSuccess(await policyRequest(request)); } catch (error) { return apiError(error, "Unable to read policy effectiveness."); } }
