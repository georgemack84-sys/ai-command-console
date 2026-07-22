import { apiError, apiSuccess } from "@/src/server/api/response";
import { operatorRequest, requireTrustHumanOversightUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustHumanOversightUser(); return apiSuccess(await operatorRequest()); } catch (error) { return apiError(error, "Unable to load Trust Operator Review."); } }
export async function POST(request: Request) { try { await requireTrustHumanOversightUser(); return apiSuccess(await operatorRequest(request)); } catch (error) { return apiError(error, "Unable to evaluate Trust Operator Review."); } }
