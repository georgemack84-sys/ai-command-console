import { apiError, apiSuccess } from "@/src/server/api/response";
import { requirePublisherUser, searchRequest } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requirePublisherUser(); return apiSuccess(await searchRequest()); } catch (error) { return apiError(error, "Unable to inspect publication search."); } }
export async function POST(request: Request) { try { await requirePublisherUser(); return apiSuccess(await searchRequest(request)); } catch (error) { return apiError(error, "Unable to inspect publication search."); } }
