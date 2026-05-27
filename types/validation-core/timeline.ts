export type ValidationTimeline = Readonly<{
  timelineId: string;
  validationId: string;
  rootEventId: string;
  events: readonly string[];
  reconstructedStateHash: string;
  deterministic: boolean;
  generatedAt: string;
  timelineHash: string;
}>;
