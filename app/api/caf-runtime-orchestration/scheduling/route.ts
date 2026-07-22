import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireRuntimeOrchestrationUser, schedulingRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireRuntimeOrchestrationUser(); return apiSuccess(await schedulingRequest()); } catch (error) { return apiError(error, "Unable to inspect CAF runtime scheduling."); } }
export async function POST(request: Request) { try { await requireRuntimeOrchestrationUser(); return apiSuccess(await schedulingRequest(request)); } catch (error) { return apiError(error, "Unable to inspect CAF runtime scheduling."); } }
