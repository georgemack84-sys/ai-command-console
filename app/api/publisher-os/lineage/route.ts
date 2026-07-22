import { apiError, apiSuccess } from "@/src/server/api/response";
import { lineageRequest, requirePublisherUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requirePublisherUser(); return apiSuccess(await lineageRequest()); } catch (error) { return apiError(error, "Unable to inspect publication lineage."); } }
export async function POST(request: Request) { try { await requirePublisherUser(); return apiSuccess(await lineageRequest(request)); } catch (error) { return apiError(error, "Unable to inspect publication lineage."); } }
