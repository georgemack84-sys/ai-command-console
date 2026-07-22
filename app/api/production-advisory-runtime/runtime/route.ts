import { requireProductionAdvisoryRuntimeUser, runtimeRequest } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireProductionAdvisoryRuntimeUser(); return apiSuccess(await runtimeRequest()); } catch (error) { return apiError(error, "Unable to load Production Advisory Runtime state."); } }
export async function POST(request: Request) { try { await requireProductionAdvisoryRuntimeUser(); return apiSuccess(await runtimeRequest(request)); } catch (error) { return apiError(error, "Unable to load Production Advisory Runtime state."); } }
