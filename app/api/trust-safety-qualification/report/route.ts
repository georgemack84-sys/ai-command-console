import { apiError, apiSuccess } from "@/src/server/api/response";
import { reportRequest, requireTrustSafetyQualificationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustSafetyQualificationUser(); return apiSuccess(await reportRequest()); } catch (error) { return apiError(error, "Unable to load Trust Safety Qualification report."); } }
export async function POST(request: Request) { try { await requireTrustSafetyQualificationUser(); return apiSuccess(await reportRequest(request)); } catch (error) { return apiError(error, "Unable to generate Trust Safety Qualification report."); } }
