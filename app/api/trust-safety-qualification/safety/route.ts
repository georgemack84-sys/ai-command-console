import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireTrustSafetyQualificationUser, safetyRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustSafetyQualificationUser(); return apiSuccess(await safetyRequest()); } catch (error) { return apiError(error, "Unable to load Trust Safety Qualification safety assessment."); } }
export async function POST(request: Request) { try { await requireTrustSafetyQualificationUser(); return apiSuccess(await safetyRequest(request)); } catch (error) { return apiError(error, "Unable to evaluate Trust Safety Qualification safety assessment."); } }
