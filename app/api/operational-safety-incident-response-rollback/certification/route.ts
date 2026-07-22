import { certificationRequest, requireOperationalSafetyUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/response";

export async function GET() { try { await requireOperationalSafetyUser(); return apiSuccess(await certificationRequest()); } catch (error) { return apiError(error, "Unable to load Operational Safety certification."); } }
export async function POST(request: Request) { try { await requireOperationalSafetyUser(); return apiSuccess(await certificationRequest(request)); } catch (error) { return apiError(error, "Unable to load Operational Safety certification."); } }
