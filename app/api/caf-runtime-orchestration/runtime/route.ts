import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireRuntimeOrchestrationUser, runtimeRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireRuntimeOrchestrationUser(); return apiSuccess(await runtimeRequest()); } catch (error) { return apiError(error, "Unable to inspect CAF runtime orchestrator."); } }
export async function POST(request: Request) { try { await requireRuntimeOrchestrationUser(); return apiSuccess(await runtimeRequest(request)); } catch (error) { return apiError(error, "Unable to inspect CAF runtime orchestrator."); } }
