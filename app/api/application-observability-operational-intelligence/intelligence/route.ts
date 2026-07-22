import { apiError, apiSuccess } from "@/src/server/api/response";
import { intelligenceRequest, requireApplicationOperationalUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireApplicationOperationalUser(); return apiSuccess(await intelligenceRequest()); } catch (error) { return apiError(error, "Unable to inspect operational intelligence."); } }
export async function POST(request: Request) { try { await requireApplicationOperationalUser(); return apiSuccess(await intelligenceRequest(request)); } catch (error) { return apiError(error, "Unable to inspect operational intelligence."); } }
