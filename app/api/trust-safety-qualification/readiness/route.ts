import { apiError, apiSuccess } from "@/src/server/api/response";
import { readinessRequest, requireTrustSafetyQualificationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustSafetyQualificationUser(); return apiSuccess(await readinessRequest()); } catch (error) { return apiError(error, "Unable to load Trust Safety Qualification readiness."); } }
export async function POST(request: Request) { try { await requireTrustSafetyQualificationUser(); return apiSuccess(await readinessRequest(request)); } catch (error) { return apiError(error, "Unable to evaluate Trust Safety Qualification readiness."); } }
