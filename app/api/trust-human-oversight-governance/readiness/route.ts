import { apiError, apiSuccess } from "@/src/server/api/response";
import { readinessRequest, requireTrustHumanOversightUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustHumanOversightUser(); return apiSuccess(await readinessRequest()); } catch (error) { return apiError(error, "Unable to load Trust Human Oversight readiness."); } }
export async function POST(request: Request) { try { await requireTrustHumanOversightUser(); return apiSuccess(await readinessRequest(request)); } catch (error) { return apiError(error, "Unable to evaluate Trust Human Oversight readiness."); } }
