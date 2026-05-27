import { AppError } from "./errors";
import { TenantScopeError } from "@/services/tenancy/tenantErrors";

export function normalizeTenantApiError(error: unknown) {
  if (error instanceof TenantScopeError) {
    return new AppError(error.status, error.code, error.message, error.details);
  }
  return error;
}
