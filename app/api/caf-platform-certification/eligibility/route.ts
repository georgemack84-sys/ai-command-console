import { apiError, apiSuccess } from "@/src/server/api/response";
import { eligibilityRequest, requirePlatformCertificationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requirePlatformCertificationUser(); return apiSuccess(await eligibilityRequest()); } catch (error) { return apiError(error, "Unable to inspect CAF certification eligibility."); } }
export async function POST(request: Request) { try { await requirePlatformCertificationUser(); return apiSuccess(await eligibilityRequest(request)); } catch (error) { return apiError(error, "Unable to inspect CAF certification eligibility."); } }
