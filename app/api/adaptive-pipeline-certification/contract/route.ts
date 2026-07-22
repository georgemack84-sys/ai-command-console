import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireAdaptivePipelineUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireAdaptivePipelineUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to retrieve adaptive pipeline certification contract."); } }
