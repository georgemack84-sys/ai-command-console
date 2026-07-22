import { apiError, apiSuccess } from "@/src/server/api/response";
import { coordinationRequest, requireRuntimeOrchestrationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireRuntimeOrchestrationUser(); return apiSuccess(await coordinationRequest()); } catch (error) { return apiError(error, "Unable to inspect CAF runtime coordination."); } }
export async function POST(request: Request) { try { await requireRuntimeOrchestrationUser(); return apiSuccess(await coordinationRequest(request)); } catch (error) { return apiError(error, "Unable to inspect CAF runtime coordination."); } }
