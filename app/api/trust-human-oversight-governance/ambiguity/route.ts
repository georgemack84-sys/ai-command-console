import { ambiguityRequest, requireTrustHumanOversightUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustHumanOversightUser(); return apiSuccess(await ambiguityRequest()); } catch (error) { return apiError(error, "Unable to load Trust Ambiguity Review."); } }
export async function POST(request: Request) { try { await requireTrustHumanOversightUser(); return apiSuccess(await ambiguityRequest(request)); } catch (error) { return apiError(error, "Unable to evaluate Trust Ambiguity Review."); } }
