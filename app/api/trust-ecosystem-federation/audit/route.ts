import { apiError, apiSuccess } from "@/src/server/api/response";
import { auditRequest, requireTrustFederationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustFederationUser(); return apiSuccess(await auditRequest()); } catch (error) { return apiError(error, "Unable to load Federation audit."); } }
export async function POST(request: Request) { try { await requireTrustFederationUser(); return apiSuccess(await auditRequest(request)); } catch (error) { return apiError(error, "Unable to evaluate Federation audit."); } }
