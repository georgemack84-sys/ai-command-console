import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireAdaptiveContractCertificationUser, sectionRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function POST(request: Request) { try { await requireAdaptiveContractCertificationUser(); return apiSuccess(await sectionRequest(request, "replay_validation")); } catch (error) { return apiError(error, "Unable to retrieve adaptive contract replay validation."); } }
