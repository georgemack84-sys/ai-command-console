import { cookies } from "next/headers";
import { getSessionUser } from "@/src/lib/auth";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { buildNuruDashboard, parseNuruPreferences } from "@/src/nuru/dashboard";
import { getNuruPreferences } from "@/src/server/services/nuru-service";
import { listPublishedNuruDiscoveries } from "@/src/server/services/nuru-studio-service";
import { getCurrentEdition } from "@/src/server/services/nuru-edition-service";
import { personalizeEdition } from "@/src/server/services/nuru-personalization-service";

export const dynamic = "force-dynamic";

const PREFERENCES_COOKIE = "nuru-preferences";

export async function GET() {
  try {
    const rawPreferences = (await cookies()).get(PREFERENCES_COOKIE)?.value;
    const user = await getSessionUser();
    const preferences = user ? await getNuruPreferences(user.id) : parseNuruPreferences(rawPreferences);
    const dashboard = buildNuruDashboard(preferences);
    const [edition, discoveries] = await Promise.all([getCurrentEdition(), listPublishedNuruDiscoveries()]);
    const editionItems = edition?.items ?? (discoveries.length ? discoveries.map((item) => ({ ...item, isFeatured: false })) : dashboard.discoveries.map((item) => ({ ...item, isFeatured: false })));
    const rankedDiscoveries = user ? await personalizeEdition(user.id, editionItems) : editionItems;
    return apiSuccess({ ...dashboard, discoveries: rankedDiscoveries });
  } catch (error) {
    return apiError(error, "Unable to load Nuru discoveries.");
  }
}
