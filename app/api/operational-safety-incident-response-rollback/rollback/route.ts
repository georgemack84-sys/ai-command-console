import { requireOperationalSafetyUser, rollbackRequest } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireOperationalSafetyUser(); return apiSuccess(await rollbackRequest()); } catch (error) { return apiError(error, "Unable to load Operational Safety rollback state."); } }
export async function POST(request: Request) { try { await requireOperationalSafetyUser(); return apiSuccess(await rollbackRequest(request)); } catch (error) { return apiError(error, "Unable to load Operational Safety rollback state."); } }
