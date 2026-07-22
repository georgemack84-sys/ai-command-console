import { apiError, apiSuccess } from "@/src/server/api/response";
import { renderingRequest, requirePublisherUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requirePublisherUser(); return apiSuccess(await renderingRequest()); } catch (error) { return apiError(error, "Unable to inspect publication rendering."); } }
export async function POST(request: Request) { try { await requirePublisherUser(); return apiSuccess(await renderingRequest(request)); } catch (error) { return apiError(error, "Unable to inspect publication rendering."); } }
