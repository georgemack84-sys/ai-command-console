import { apiError, apiSuccess } from "@/src/server/api/response";
import { registryRequest, requireSpecificationGovernanceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireSpecificationGovernanceUser(); return apiSuccess(await registryRequest()); } catch (error) { return apiError(error, "Unable to retrieve specification registry."); } }
export async function POST(request: Request) { try { await requireSpecificationGovernanceUser(); return apiSuccess(await registryRequest(request)); } catch (error) { return apiError(error, "Unable to retrieve specification registry."); } }
