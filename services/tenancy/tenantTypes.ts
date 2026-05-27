export type TenantContextSource = "session" | "apiKey" | "test" | "system";

export type TenantContext = {
  tenantId: string;
  workspaceId: string;
  operatorId?: string;
  source: TenantContextSource;
  isolationVersion: "3.6G";
};

export type TenantScopedRecord = {
  tenantId?: string;
  workspaceId?: string;
  executionId?: string;
};
