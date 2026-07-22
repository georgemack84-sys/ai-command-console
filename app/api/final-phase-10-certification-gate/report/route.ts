import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireFinalPhase10User, sectionRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function POST(request: Request) { try { await requireFinalPhase10User(); return apiSuccess(await sectionRequest(request, "final_report")); } catch (error) { return apiError(error, "Unable to retrieve final Phase 10 certification report."); } }
