import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireLineageCertificationUser, runLineageCertificationRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireLineageCertificationUser();
    return apiSuccess(await runLineageCertificationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to run lineage certification.");
  }
}
