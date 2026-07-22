import { apiError, apiSuccess } from "@/src/server/api/response";
import { authoringRequest, requirePublisherUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requirePublisherUser(); return apiSuccess(await authoringRequest()); } catch (error) { return apiError(error, "Unable to inspect authoring framework."); } }
export async function POST(request: Request) { try { await requirePublisherUser(); return apiSuccess(await authoringRequest(request)); } catch (error) { return apiError(error, "Unable to inspect authoring framework."); } }
