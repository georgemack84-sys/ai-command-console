import type { Headline, HeadlineCategory } from "@/types/headline";

export type CivitasMode = "local" | "civitas";
export type CapabilityStatus = "enabled" | "disabled" | "degraded" | "planned";
export type TrustStanding = "NOMINAL" | "DEGRADED" | "SUSPENDED" | "REVOKED" | "EXPIRED" | "UNKNOWN";

export type CapabilityDescriptor = {
  id: string;
  version: string;
  dependencies: string[];
  owner: string;
  status: CapabilityStatus;
  health: "ok" | "warning" | "degraded";
  inputs: string[];
  outputs: string[];
};

export type StoryTrust = {
  trustStanding: TrustStanding;
  confidence: number;
  evidenceCount: number;
  sourceReputation: number;
  misinformationRisk: number;
  explanation: string;
  evaluatedAt: string;
  history: Array<{ standing: TrustStanding; at: string; reason: string }>;
};

export type CivitasEventName =
  | "HeadlineDiscovered"
  | "HeadlineNormalized"
  | "HeadlineRanked"
  | "HeadlineDeduplicated"
  | "ImageResolved"
  | "ImageResolutionFailed"
  | "StorySaved"
  | "StoryHidden"
  | "CategoryChanged"
  | "PresentationStarted"
  | "PresentationPaused"
  | "PresentationStopped"
  | "PresentationAdvanced"
  | "TrustEvaluated"
  | "ReplayCompleted"
  | "QualificationCompleted";

export type CivitasEvent = {
  id: string;
  name: CivitasEventName;
  payload: Record<string, unknown>;
  timestamp: string;
  correlationId: string;
  replayId: string;
  immutable: true;
};

export type ProvingEvidence = {
  id: string;
  workflow: string;
  eventId: string;
  replayId: string;
  qualificationId: string;
  timestamp: string;
  payload: Record<string, unknown>;
};

export type TelemetryRecord = {
  component: string;
  operation: string;
  durationMs: number;
  success: boolean;
  failure?: string;
  timestamp: string;
  correlationId: string;
  replayId: string;
  qualificationId: string;
};

export type HeadlineFlowConfiguration = {
  mode: CivitasMode;
  providers: { news: string; image: string; trust: string };
  categories: HeadlineCategory[];
  featureFlags: {
    civitasIntegration: boolean;
    cafAgents: boolean;
    trustEvaluation: boolean;
    provingEvidence: boolean;
    operationsDashboard: boolean;
    recommendations: boolean;
    briefing: boolean;
    voiceNarration: boolean;
  };
  trust: { enabled: boolean; provider: string };
  caf: { enabled: boolean; agentRuntime: CivitasMode };
  presentation: { defaultDisplayProfile: DisplayProfileId };
  replay: { enabled: boolean };
  qualification: { enabled: boolean };
  telemetry: { enabled: boolean };
  dashboard: { enabled: boolean; route: string };
  theme: { name: string };
  displayProfile: DisplayProfileId;
};

export type DisplayProfileId =
  | "desktop"
  | "tablet"
  | "phone"
  | "tv"
  | "kiosk"
  | "raspberry-pi"
  | "command-center"
  | "mission-control";

export type DisplayProfile = {
  id: DisplayProfileId;
  typography: "standard" | "large" | "television";
  spacing: "compact" | "comfortable" | "broadcast";
  imageRatio: string;
  transitionSpeedMs: number;
  controls: "full" | "essential" | "minimal";
};

export interface CivitasAgent<Input = unknown, Output = unknown> {
  readonly id: string;
  execute(input: Input): Promise<Output>;
  explain(input: Input): Promise<string>;
  replay(input: Input, replayId: string): Promise<Output>;
  qualify(): Promise<{ qualified: boolean; evidence: string[] }>;
}

export interface TrustProvider {
  evaluate(story: Headline): Promise<StoryTrust>;
}

export type ApplicationMetadata = {
  identity: { id: string; name: string; ecosystem: "civitas"; independentlyDeployable: true };
  manifest: { version: string; capabilities: string[]; programs: number[] };
  registryEntry: { status: "registered"; owner: string };
  versionRegistry: { current: string; channel: string };
  evidence: { count: number; latest?: string };
  certificationStatus: "local-qualified" | "pending-civitas-certification";
  deploymentLineage: { environment: string; mode: CivitasMode };
  healthStatus: "ok" | "warning" | "degraded";
  operationalStatus: "running" | "starting" | "degraded";
  runtimeMetadata: { generatedAt: string; provider: string };
};
