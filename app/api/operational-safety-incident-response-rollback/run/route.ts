import { requireOperationalSafetyUser, resultRequest } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireOperationalSafetyUser(); return apiSuccess(await resultRequest()); } catch (error) { return apiError(error, "Unable to run Operational Safety certification."); } }
export async function POST(request: Request) { try { await requireOperationalSafetyUser(); return apiSuccess(await resultRequest(request)); } catch (error) { return apiError(error, "Unable to run Operational Safety certification."); } }
