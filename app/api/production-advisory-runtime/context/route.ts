import { contextRequest, requireProductionAdvisoryRuntimeUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireProductionAdvisoryRuntimeUser(); return apiSuccess(await contextRequest()); } catch (error) { return apiError(error, "Unable to load Production Advisory Runtime context."); } }
export async function POST(request: Request) { try { await requireProductionAdvisoryRuntimeUser(); return apiSuccess(await contextRequest(request)); } catch (error) { return apiError(error, "Unable to load Production Advisory Runtime context."); } }
