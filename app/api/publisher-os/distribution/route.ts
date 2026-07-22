import { apiError, apiSuccess } from "@/src/server/api/response";
import { distributionRequest, requirePublisherUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requirePublisherUser(); return apiSuccess(await distributionRequest()); } catch (error) { return apiError(error, "Unable to inspect publication distribution."); } }
export async function POST(request: Request) { try { await requirePublisherUser(); return apiSuccess(await distributionRequest(request)); } catch (error) { return apiError(error, "Unable to inspect publication distribution."); } }
