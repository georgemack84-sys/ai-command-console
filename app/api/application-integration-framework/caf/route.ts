import { apiError, apiSuccess } from "@/src/server/api/response";
import { cafRequest, requireApplicationIntegrationUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireApplicationIntegrationUser(); return apiSuccess(await cafRequest()); } catch (error) { return apiError(error, "Unable to inspect CAF integration adapter."); } }
export async function POST(request: Request) { try { await requireApplicationIntegrationUser(); return apiSuccess(await cafRequest(request)); } catch (error) { return apiError(error, "Unable to inspect CAF integration adapter."); } }
