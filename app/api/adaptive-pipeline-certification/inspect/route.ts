import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectRequest, requireAdaptivePipelineUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireAdaptivePipelineUser(); return apiSuccess(await inspectRequest()); } catch (error) { return apiError(error, "Unable to inspect adaptive pipeline certification."); } }
export async function POST(request: Request) { try { await requireAdaptivePipelineUser(); return apiSuccess(await inspectRequest(request)); } catch (error) { return apiError(error, "Unable to inspect adaptive pipeline certification."); } }
