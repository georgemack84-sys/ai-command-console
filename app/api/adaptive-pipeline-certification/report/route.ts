import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireAdaptivePipelineUser, sectionRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function POST(request: Request) { try { await requireAdaptivePipelineUser(); return apiSuccess(await sectionRequest(request, "certification_report")); } catch (error) { return apiError(error, "Unable to retrieve adaptive pipeline certification report."); } }
