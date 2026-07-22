import { apiError, apiSuccess } from "@/src/server/api/response";
import { executionRequest, requireApexUser } from "../core";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET() { try { await requireApexUser(); return apiSuccess(await executionRequest()); } catch (error) { return apiError(error, "Unable to inspect APEX execution coordination."); } }
export async function POST(request: Request) { try { await requireApexUser(); return apiSuccess(await executionRequest(request)); } catch (error) { return apiError(error, "Unable to inspect APEX execution coordination."); } }
