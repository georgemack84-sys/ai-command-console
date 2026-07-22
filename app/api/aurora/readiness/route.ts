import { apiError, apiSuccess } from "@/src/server/api/response";
import { readinessRequest, requireAuroraUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireAuroraUser(); return apiSuccess(await readinessRequest()); } catch (error) { return apiError(error, "Unable to inspect Aurora readiness."); } }
export async function POST(request: Request) { try { await requireAuroraUser(); return apiSuccess(await readinessRequest(request)); } catch (error) { return apiError(error, "Unable to inspect Aurora readiness."); } }
