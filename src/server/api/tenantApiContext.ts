import type { SessionUser } from "@/src/lib/types";
import { resolveTenantContextFromSessionUser } from "@/services/tenancy/tenantContextResolver";

export function requireTenantApiContext({
  request,
  user,
}: {
  request: Request;
  user: SessionUser;
}) {
  return resolveTenantContextFromSessionUser({
    request,
    user,
  });
}
