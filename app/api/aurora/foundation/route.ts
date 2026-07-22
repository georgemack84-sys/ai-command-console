import { apiError, apiSuccess } from "@/src/server/api/response";
import { foundationRequest, requireAuroraUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireAuroraUser(); return apiSuccess(await foundationRequest()); } catch (error) { return apiError(error, "Unable to inspect Aurora foundation."); } }
export async function POST(request: Request) { try { await requireAuroraUser(); return apiSuccess(await foundationRequest(request)); } catch (error) { return apiError(error, "Unable to inspect Aurora foundation."); } }
