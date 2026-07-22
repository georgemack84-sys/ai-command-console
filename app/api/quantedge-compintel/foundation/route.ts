import { apiError, apiSuccess } from "@/src/server/api/response";
import { foundationRequest, requireQciUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireQciUser(); return apiSuccess(await foundationRequest()); } catch (error) { return apiError(error, "Unable to inspect QCI foundation."); } }
export async function POST(request: Request) { try { await requireQciUser(); return apiSuccess(await foundationRequest(request)); } catch (error) { return apiError(error, "Unable to inspect QCI foundation."); } }
