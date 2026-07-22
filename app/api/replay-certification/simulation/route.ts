import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireReplayCertificationUser, sectionRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function POST(request: Request) { try { await requireReplayCertificationUser(); return apiSuccess(await sectionRequest(request, "simulation_replay")); } catch (error) { return apiError(error, "Unable to retrieve simulation replay certification."); } }
