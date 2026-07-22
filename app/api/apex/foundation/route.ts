import { apiError, apiSuccess } from "@/src/server/api/response";
import { foundationRequest, requireApexUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireApexUser(); return apiSuccess(await foundationRequest()); } catch (error) { return apiError(error, "Unable to inspect APEX foundation."); } }
export async function POST(request: Request) { try { await requireApexUser(); return apiSuccess(await foundationRequest(request)); } catch (error) { return apiError(error, "Unable to inspect APEX foundation."); } }
