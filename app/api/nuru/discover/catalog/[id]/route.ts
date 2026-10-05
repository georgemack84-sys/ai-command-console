import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireNuruGovernor } from "@/src/server/api/nuru-api";
import { nuruDiscoverCatalogAdmissionSchema, setNuruDiscoverCatalogAdmission } from "@/src/server/services/nuru-discover-catalog-service";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const governor = await requireNuruGovernor();
    const { id } = await context.params;
    const admission = nuruDiscoverCatalogAdmissionSchema.parse(await request.json());
    return apiSuccess(await setNuruDiscoverCatalogAdmission(id, admission, governor.id));
  } catch (error) {
    return apiError(error, "Unable to update Nuru Discover catalog admission.");
  }
}
