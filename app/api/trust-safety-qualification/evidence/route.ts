import { apiError, apiSuccess } from "@/src/server/api/response";
import { evidenceRequest, requireTrustSafetyQualificationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustSafetyQualificationUser(); return apiSuccess(await evidenceRequest()); } catch (error) { return apiError(error, "Unable to load Trust Safety Qualification evidence."); } }
export async function POST(request: Request) { try { await requireTrustSafetyQualificationUser(); return apiSuccess(await evidenceRequest(request)); } catch (error) { return apiError(error, "Unable to evaluate Trust Safety Qualification evidence."); } }
