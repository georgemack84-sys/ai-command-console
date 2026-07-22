import { certificationRequest, requireOperationalLearningUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/responses";

export async function GET() { try { await requireOperationalLearningUser(); return apiSuccess(await certificationRequest()); } catch (error) { return apiError(error, "Unable to read operational learning certification."); } }
export async function POST(request: Request) { try { await requireOperationalLearningUser(); return apiSuccess(await certificationRequest(request)); } catch (error) { return apiError(error, "Unable to read operational learning certification."); } }
