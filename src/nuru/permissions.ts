export const nuruPermissionActions = ["READ", "SEARCH", "DISCOVER", "PROPOSE", "CLASSIFY", "CONNECT", "ARCHIVE", "SUPERSEDE", "DELETE", "ADMINISTER"] as const;
export type NuruPermissionAction = (typeof nuruPermissionActions)[number];
export const nuruResources = ["knowledge", "metadata", "relationships", "proposals", "archive", "permissions", "audit", "embeddings"] as const;
