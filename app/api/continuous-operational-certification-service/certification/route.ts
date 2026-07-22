import { certificationRequest, requireContinuousOperationalCertificationUser } from "../core";
import { apiError, apiSuccess } from "@/src/server/api/responses";

export async function GET() { try { await requireContinuousOperationalCertificationUser(); return apiSuccess(await certificationRequest()); } catch (error) { return apiError(error, "Unable to read continuous operational certification."); } }
export async function POST(request: Request) { try { await requireContinuousOperationalCertificationUser(); return apiSuccess(await certificationRequest(request)); } catch (error) { return apiError(error, "Unable to read continuous operational certification."); } }
