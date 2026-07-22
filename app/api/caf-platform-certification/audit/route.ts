import { apiError, apiSuccess } from "@/src/server/api/response";
import { auditRequest, requirePlatformCertificationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requirePlatformCertificationUser(); return apiSuccess(await auditRequest()); } catch (error) { return apiError(error, "Unable to inspect CAF certification audit lineage."); } }
export async function POST(request: Request) { try { await requirePlatformCertificationUser(); return apiSuccess(await auditRequest(request)); } catch (error) { return apiError(error, "Unable to inspect CAF certification audit lineage."); } }
