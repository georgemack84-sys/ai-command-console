import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireAdaptiveContractCertificationUser, sectionRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function POST(request: Request) { try { await requireAdaptiveContractCertificationUser(); return apiSuccess(await sectionRequest(request, "boundary_report")); } catch (error) { return apiError(error, "Unable to retrieve boundary compliance report."); } }
