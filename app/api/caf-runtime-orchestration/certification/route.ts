import { apiError, apiSuccess } from "@/src/server/api/response";
import { certificationRequest, requireRuntimeOrchestrationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireRuntimeOrchestrationUser(); return apiSuccess(await certificationRequest()); } catch (error) { return apiError(error, "Unable to inspect CAF runtime certification."); } }
export async function POST(request: Request) { try { await requireRuntimeOrchestrationUser(); return apiSuccess(await certificationRequest(request)); } catch (error) { return apiError(error, "Unable to inspect CAF runtime certification."); } }
