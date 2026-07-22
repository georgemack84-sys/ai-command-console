import { forensicsRequest, requireOperationalSafetyUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireOperationalSafetyUser(); return apiSuccess(await forensicsRequest()); } catch (error) { return apiError(error, "Unable to load Operational Safety forensics."); } }
export async function POST(request: Request) { try { await requireOperationalSafetyUser(); return apiSuccess(await forensicsRequest(request)); } catch (error) { return apiError(error, "Unable to load Operational Safety forensics."); } }
