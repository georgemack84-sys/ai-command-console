import { requireProductionAdvisoryRuntimeUser, resultRequest } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireProductionAdvisoryRuntimeUser(); return apiSuccess(await resultRequest()); } catch (error) { return apiError(error, "Unable to run Production Advisory Runtime."); } }
export async function POST(request: Request) { try { await requireProductionAdvisoryRuntimeUser(); return apiSuccess(await resultRequest(request)); } catch (error) { return apiError(error, "Unable to run Production Advisory Runtime."); } }
