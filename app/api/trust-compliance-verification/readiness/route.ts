import { apiError, apiSuccess } from "@/src/server/api/response";
import { readinessRequest, requireTrustComplianceUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustComplianceUser(); return apiSuccess(await readinessRequest()); } catch (error) { return apiError(error, "Unable to inspect Trust Compliance Verification readiness."); } }
export async function POST(request: Request) { try { await requireTrustComplianceUser(); return apiSuccess(await readinessRequest(request)); } catch (error) { return apiError(error, "Unable to project Trust Compliance Verification readiness."); } }
