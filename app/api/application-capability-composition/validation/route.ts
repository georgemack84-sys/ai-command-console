import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireApplicationCapabilityCompositionUser, validationReportRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireApplicationCapabilityCompositionUser(); return apiSuccess(await validationReportRequest()); } catch (error) { return apiError(error, "Unable to inspect composition validation report."); } }
export async function POST(request: Request) { try { await requireApplicationCapabilityCompositionUser(); return apiSuccess(await validationReportRequest(request)); } catch (error) { return apiError(error, "Unable to inspect composition validation report."); } }
