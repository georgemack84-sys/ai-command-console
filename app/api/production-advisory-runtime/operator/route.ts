import { operatorRequest, requireProductionAdvisoryRuntimeUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireProductionAdvisoryRuntimeUser(); return apiSuccess(await operatorRequest()); } catch (error) { return apiError(error, "Unable to load Production Advisory Runtime operator interaction."); } }
export async function POST(request: Request) { try { await requireProductionAdvisoryRuntimeUser(); return apiSuccess(await operatorRequest(request)); } catch (error) { return apiError(error, "Unable to load Production Advisory Runtime operator interaction."); } }
