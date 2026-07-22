import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireCrossApplicationInteroperabilityUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireCrossApplicationInteroperabilityUser(); return apiSuccess(contractResponse()); } catch (error) { return apiError(error, "Unable to inspect Cross-Application Interoperability contract."); } }
