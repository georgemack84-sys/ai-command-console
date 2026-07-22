import { apiError, apiSuccess } from "@/src/server/api/response";
import { qualificationRequest, requireTrustSafetyQualificationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustSafetyQualificationUser(); return apiSuccess(await qualificationRequest()); } catch (error) { return apiError(error, "Unable to load Trust Safety Qualification record."); } }
export async function POST(request: Request) { try { await requireTrustSafetyQualificationUser(); return apiSuccess(await qualificationRequest(request)); } catch (error) { return apiError(error, "Unable to evaluate Trust Safety Qualification record."); } }
