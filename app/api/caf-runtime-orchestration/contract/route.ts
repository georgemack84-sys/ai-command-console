import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireRuntimeOrchestrationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireRuntimeOrchestrationUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to inspect CAF runtime orchestration contract."); } }
