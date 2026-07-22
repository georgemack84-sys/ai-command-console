import { apiError, apiSuccess } from "@/src/server/api/response";
import { integrationRequest, requireAuroraUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireAuroraUser(); return apiSuccess(await integrationRequest()); } catch (error) { return apiError(error, "Unable to inspect Aurora integrations."); } }
export async function POST(request: Request) { try { await requireAuroraUser(); return apiSuccess(await integrationRequest(request)); } catch (error) { return apiError(error, "Unable to inspect Aurora integrations."); } }
