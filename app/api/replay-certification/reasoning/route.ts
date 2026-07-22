import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireReplayCertificationUser, sectionRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function POST(request: Request) { try { await requireReplayCertificationUser(); return apiSuccess(await sectionRequest(request, "reasoning_equivalence")); } catch (error) { return apiError(error, "Unable to retrieve reasoning equivalence certification."); } }
