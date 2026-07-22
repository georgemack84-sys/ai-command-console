import { apiError, apiSuccess } from "@/src/server/api/response";
import { lifecycleRequest, requireSpecificationGovernanceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireSpecificationGovernanceUser(); return apiSuccess(await lifecycleRequest()); } catch (error) { return apiError(error, "Unable to retrieve specification lifecycle contract."); } }
export async function POST(request: Request) { try { await requireSpecificationGovernanceUser(); return apiSuccess(await lifecycleRequest(request)); } catch (error) { return apiError(error, "Unable to retrieve specification lifecycle contract."); } }
