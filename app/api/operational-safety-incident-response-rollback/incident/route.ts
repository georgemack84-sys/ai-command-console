import { incidentRequest, requireOperationalSafetyUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireOperationalSafetyUser(); return apiSuccess(await incidentRequest()); } catch (error) { return apiError(error, "Unable to load Operational Safety incident state."); } }
export async function POST(request: Request) { try { await requireOperationalSafetyUser(); return apiSuccess(await incidentRequest(request)); } catch (error) { return apiError(error, "Unable to load Operational Safety incident state."); } }
