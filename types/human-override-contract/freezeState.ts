export type FreezeType =
  | "soft"
  | "hard"
  | "constitutional"
  | "isolation"
  | "global";

export type FreezeState = Readonly<{
  freezeId: string;
  freezeType: FreezeType;
  initiatedBy: string;
  active: boolean;
  affectedScopes: readonly string[];
  createdAt: string;
  releasedAt?: string;
  governanceHash: string;
}>;
