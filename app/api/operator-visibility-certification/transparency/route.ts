import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireOperatorVisibilityUser, sectionRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function POST(request: Request) { try { await requireOperatorVisibilityUser(); return apiSuccess(await sectionRequest(request, "transparency_report")); } catch (error) { return apiError(error, "Unable to retrieve adaptive transparency report."); } }
