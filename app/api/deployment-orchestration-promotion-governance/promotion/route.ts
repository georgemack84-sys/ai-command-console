import { apiError, apiSuccess } from "@/src/server/api/response";
import { promotionRequest, requireDeploymentGovernanceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireDeploymentGovernanceUser(); return apiSuccess(await promotionRequest()); } catch (error) { return apiError(error, "Unable to load promotion governance."); } }
export async function POST(request: Request) { try { await requireDeploymentGovernanceUser(); return apiSuccess(await promotionRequest(request)); } catch (error) { return apiError(error, "Unable to load promotion governance."); } }
