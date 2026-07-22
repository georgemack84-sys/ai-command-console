import { apiError, apiSuccess } from "@/src/server/api/response";
import { operationsRequest, requireAuroraUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireAuroraUser(); return apiSuccess(await operationsRequest()); } catch (error) { return apiError(error, "Unable to inspect Aurora operations."); } }
export async function POST(request: Request) { try { await requireAuroraUser(); return apiSuccess(await operationsRequest(request)); } catch (error) { return apiError(error, "Unable to inspect Aurora operations."); } }
