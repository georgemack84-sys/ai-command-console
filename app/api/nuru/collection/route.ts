import { cookies } from "next/headers";
import { getSessionUser } from "@/src/lib/auth";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { getNuruDiscoveryDetail, parseNuruPreferences } from "@/src/nuru/dashboard";
import { getSavedNuruDiscoveries } from "@/src/server/services/nuru-service";

export const dynamic = "force-dynamic";

const PREFERENCES_COOKIE = "nuru-preferences";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (user) {
      const saved = await getSavedNuruDiscoveries(user.id);
      return apiSuccess(saved.map(({ discovery }) => ({
        id: discovery.id,
        title: discovery.title,
        meta: discovery.meta,
        score: discovery.matchScore,
        image: discovery.imageKey,
        kind: discovery.category.replace("_", " "),
      })));
    }

    const preferences = parseNuruPreferences((await cookies()).get(PREFERENCES_COOKIE)?.value);
    const saved = preferences.savedDiscoveryIds
      .map((id) => getNuruDiscoveryDetail(id))
      .filter((discovery) => discovery !== null)
      .map((discovery) => ({ id: discovery.id, title: discovery.title, meta: discovery.meta, score: discovery.score, image: discovery.image, kind: discovery.kind }));
    return apiSuccess(saved);
  } catch (error) {
    return apiError(error, "Unable to load your Nuru collection.");
  }
}
