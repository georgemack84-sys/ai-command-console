import { apiError, apiSuccess } from "@/src/server/api/response";
import { interventionRequest, requireTrustHumanOversightUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustHumanOversightUser(); return apiSuccess(await interventionRequest()); } catch (error) { return apiError(error, "Unable to load Trust Intervention Governance."); } }
export async function POST(request: Request) { try { await requireTrustHumanOversightUser(); return apiSuccess(await interventionRequest(request)); } catch (error) { return apiError(error, "Unable to evaluate Trust Intervention Governance."); } }
