import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireApplicationLifecycleCertificationUser, tenantQualificationRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireApplicationLifecycleCertificationUser(); return apiSuccess(await tenantQualificationRequest()); } catch (error) { return apiError(error, "Unable to inspect tenant qualification compatibility."); } }
export async function POST(request: Request) { try { await requireApplicationLifecycleCertificationUser(); return apiSuccess(await tenantQualificationRequest(request)); } catch (error) { return apiError(error, "Unable to inspect tenant qualification compatibility."); } }
