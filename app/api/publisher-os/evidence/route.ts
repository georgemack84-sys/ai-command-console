import { apiError, apiSuccess } from "@/src/server/api/response";
import { evidenceRequest, requirePublisherUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requirePublisherUser(); return apiSuccess(await evidenceRequest()); } catch (error) { return apiError(error, "Unable to inspect publication evidence."); } }
export async function POST(request: Request) { try { await requirePublisherUser(); return apiSuccess(await evidenceRequest(request)); } catch (error) { return apiError(error, "Unable to inspect publication evidence."); } }
