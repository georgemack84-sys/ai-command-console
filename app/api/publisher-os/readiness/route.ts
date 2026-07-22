import { apiError, apiSuccess } from "@/src/server/api/response";
import { readinessRequest, requirePublisherUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requirePublisherUser(); return apiSuccess(await readinessRequest()); } catch (error) { return apiError(error, "Unable to inspect Publisher OS readiness."); } }
export async function POST(request: Request) { try { await requirePublisherUser(); return apiSuccess(await readinessRequest(request)); } catch (error) { return apiError(error, "Unable to inspect Publisher OS readiness."); } }
