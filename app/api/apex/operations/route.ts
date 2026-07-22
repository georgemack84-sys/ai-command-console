import { apiError, apiSuccess } from "@/src/server/api/response";
import { operationsRequest, requireApexUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireApexUser(); return apiSuccess(await operationsRequest()); } catch (error) { return apiError(error, "Unable to inspect APEX operations."); } }
export async function POST(request: Request) { try { await requireApexUser(); return apiSuccess(await operationsRequest(request)); } catch (error) { return apiError(error, "Unable to inspect APEX operations."); } }
