import { apiError, apiSuccess } from "@/src/server/api/response";
import { dashboardRequest, inspectRequest, requireFinalPhase10User } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireFinalPhase10User(); return apiSuccess(await inspectRequest()); } catch (error) { return apiError(error, "Unable to inspect final Phase 10 certification gate."); } }
export async function POST(request: Request) { try { await requireFinalPhase10User(); return apiSuccess(await dashboardRequest(request)); } catch (error) { return apiError(error, "Unable to execute final Phase 10 certification gate."); } }
