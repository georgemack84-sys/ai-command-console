import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireFinalPhase10User, sectionRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function POST(request: Request) { try { await requireFinalPhase10User(); return apiSuccess(await sectionRequest(request, "completion_certificate")); } catch (error) { return apiError(error, "Unable to retrieve Phase 10 completion certificate."); } }
