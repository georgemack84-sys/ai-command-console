import { apiError, apiSuccess } from "@/src/server/api/response";
import { registryRequest, requirePublisherUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requirePublisherUser(); return apiSuccess(await registryRequest()); } catch (error) { return apiError(error, "Unable to inspect publication registry."); } }
export async function POST(request: Request) { try { await requirePublisherUser(); return apiSuccess(await registryRequest(request)); } catch (error) { return apiError(error, "Unable to inspect publication registry."); } }
