import { complianceRequest, requireAdaptiveGovernanceUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/responses";

export async function GET() { try { await requireAdaptiveGovernanceUser(); return apiSuccess(await complianceRequest()); } catch (error) { return apiError(error, "Unable to read constitutional compliance."); } }
export async function POST(request: Request) { try { await requireAdaptiveGovernanceUser(); return apiSuccess(await complianceRequest(request)); } catch (error) { return apiError(error, "Unable to read constitutional compliance."); } }
