import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectLineageCertificationRequest, requireLineageCertificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireLineageCertificationUser();
    return apiSuccess(await inspectLineageCertificationRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect lineage certification.");
  }
}

export async function POST(request: Request) {
  try {
    await requireLineageCertificationUser();
    return apiSuccess(await inspectLineageCertificationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect lineage certification.");
  }
}
