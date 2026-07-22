import { apiError, apiSuccess } from "@/src/server/api/response";
import { interoperabilityRequest, requireEcosystemApplicationQualificationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET(request: Request) { try { await requireEcosystemApplicationQualificationUser(); return apiSuccess(await interoperabilityRequest(request)); } catch (error) { return apiError(error, "Unable to inspect interoperability qualification."); } }
