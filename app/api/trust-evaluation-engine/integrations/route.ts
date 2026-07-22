import { apiError, apiSuccess } from "@/src/server/api/response";
import { integrationsRequest, requireTrustEvaluationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustEvaluationUser(); return apiSuccess(await integrationsRequest()); } catch (error) { return apiError(error, "Unable to inspect evaluation integrations."); } }
export async function POST(request: Request) { try { await requireTrustEvaluationUser(); return apiSuccess(await integrationsRequest(request)); } catch (error) { return apiError(error, "Unable to project evaluation integrations."); } }
