import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireAdaptivePipelineUser, subsystemRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function POST(request: Request) { try { await requireAdaptivePipelineUser(); return apiSuccess(await subsystemRequest(request)); } catch (error) { return apiError(error, "Unable to retrieve subsystem certifications."); } }
