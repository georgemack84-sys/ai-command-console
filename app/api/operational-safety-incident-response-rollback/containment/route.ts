import { containmentRequest, requireOperationalSafetyUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireOperationalSafetyUser(); return apiSuccess(await containmentRequest()); } catch (error) { return apiError(error, "Unable to load Operational Safety containment state."); } }
export async function POST(request: Request) { try { await requireOperationalSafetyUser(); return apiSuccess(await containmentRequest(request)); } catch (error) { return apiError(error, "Unable to load Operational Safety containment state."); } }
