export type CoordinationIsolation = Readonly<{
  isolationId: string;
  isolated: boolean;
  overrideReachable: boolean;
  deniedRuntimeOperations: readonly string[];
  deniedTopologyPatterns: readonly string[];
  createdAt: string;
}>;
