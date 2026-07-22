import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireTrustExplainabilityUser, transparencyRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustExplainabilityUser(); return apiSuccess(await transparencyRequest()); } catch (error) { return apiError(error, "Unable to load Trust Transparency record."); } }
export async function POST(request: Request) { try { await requireTrustExplainabilityUser(); return apiSuccess(await transparencyRequest(request)); } catch (error) { return apiError(error, "Unable to generate Trust Transparency record."); } }
