export type ValidationViewItem = Readonly<{
  validator: string;
  status: string;
  passed: boolean;
  failureCode?: string;
  evidence: readonly string[];
  hash: string;
}>;

export type ValidationProjection = Readonly<{
  status: string;
  deterministic: boolean;
  items: readonly ValidationViewItem[];
  projectionHash: string;
}>;
