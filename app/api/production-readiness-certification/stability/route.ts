import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireProductionReadinessUser, sectionRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function POST(request: Request) { try { await requireProductionReadinessUser(); return apiSuccess(await sectionRequest(request, "stability_validation")); } catch (error) { return apiError(error, "Unable to retrieve stability validation."); } }
