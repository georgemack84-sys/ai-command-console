import { apiError, apiSuccess } from "@/src/server/api/response";
import { hashLineageCertificationRequest, requireLineageCertificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireLineageCertificationUser();
    return apiSuccess(await hashLineageCertificationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to hash lineage certification report.");
  }
}
