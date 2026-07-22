import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayRequest, requireTrustExplainabilityUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireTrustExplainabilityUser(); return apiSuccess(await replayRequest()); } catch (error) { return apiError(error, "Unable to load Trust Explanation replay state."); } }
export async function POST(request: Request) { try { await requireTrustExplainabilityUser(); return apiSuccess(await replayRequest(request)); } catch (error) { return apiError(error, "Unable to validate Trust Explanation replay state."); } }
