import { apiError, apiSuccess } from "@/src/server/api/response";
import { governanceRequest, requireTrustSafetyQualificationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustSafetyQualificationUser(); return apiSuccess(await governanceRequest()); } catch (error) { return apiError(error, "Unable to load Trust Safety Qualification governance state."); } }
export async function POST(request: Request) { try { await requireTrustSafetyQualificationUser(); return apiSuccess(await governanceRequest(request)); } catch (error) { return apiError(error, "Unable to evaluate Trust Safety Qualification governance state."); } }
