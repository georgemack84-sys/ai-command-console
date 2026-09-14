import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError } from "@/src/server/api/response";
import { exportNuruData } from "@/src/server/services/nuru-privacy-service";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) throw new AppError(401, "unauthorized", "Sign in to export Nuru data.");
    const payload = await exportNuruData(user.id);
    return new Response(JSON.stringify(payload, null, 2), { headers: { "content-type": "application/json", "content-disposition": "attachment; filename=nuru-data.json" } });
  } catch (error) { return apiError(error, "Unable to export Nuru data."); }
}
