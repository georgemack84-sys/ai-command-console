import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireGovernanceVisibilityCertificationUser, reportForRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET(request: Request) { try { await requireGovernanceVisibilityCertificationUser(); return apiSuccess(reportForRequest(request).certification_tests); } catch (error) { return apiError(error, "Unable to retrieve governance visibility certification tests."); } }
