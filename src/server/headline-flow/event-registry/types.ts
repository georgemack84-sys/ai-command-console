import type { CanonicalStory, HeadlineFlowTopic, StoryPackage } from "@/src/server/headline-flow/domain/types";

export type HeadlineFlowEventStatus = "new" | "developing" | "updated" | "resolved";
export type HeadlineFlowEventUpdateReason =
  | "new_evidence"
  | "source_corroboration"
  | "lead_angle_changed"
  | "duplicate"
  | "stale";
export type HeadlineFlowEventUserAction = "save" | "unsave" | "mute" | "unmute" | "resolve" | "restore";

export type HeadlineFlowEventPreference = {
  id: string;
  workspaceId: string;
  userId: string;
  eventId: string;
  savedAt: string | null;
  mutedAt: string | null;
  resolvedAt: string | null;
  restoredAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type HeadlineFlowEventEvidence = {
  id: string;
  storyPackageId: string;
  articleId: string | null;
  providerId: string | null;
  providerArticleId: string | null;
  sourceId: string;
  sourceName: string;
  articleUrl: string | null;
  articleFingerprint: string | null;
  author: string | null;
  imageUrl: string | null;
  headline: string;
  summary: string;
  topic: HeadlineFlowTopic;
  publishedAt: string;
  retrievedAt: string | null;
  observedAt: string;
  updateReason: HeadlineFlowEventUpdateReason;
};

export type HeadlineFlowEventRegistryStoryInput = {
  storyPackage: StoryPackage;
  canonicalStory?: CanonicalStory;
};

export type HeadlineFlowEventRecord = {
  id: string;
  workspaceId: string;
  title: string;
  summary: string;
  topic: HeadlineFlowTopic;
  status: HeadlineFlowEventStatus;
  importance: StoryPackage["importance"];
  confidence: StoryPackage["confidence"];
  firstDetectedAt: string;
  lastUpdatedAt: string;
  lastMeaningfulUpdateAt: string;
  version: number;
  matchKey: string;
  updateSummary: string;
  updateReasons: HeadlineFlowEventUpdateReason[];
  sourceCount: number;
  articleCount: number;
  evidence: HeadlineFlowEventEvidence[];
};

export type HeadlineFlowEventRegistryRepository = {
  findByIdForWorkspace(eventId: string, workspaceId: string): Promise<HeadlineFlowEventRecord | null>;
  listByWorkspace(workspaceId: string): Promise<HeadlineFlowEventRecord[]>;
  upsert(event: HeadlineFlowEventRecord): Promise<HeadlineFlowEventRecord>;
};

export type HeadlineFlowEventRegistryIngestResult = {
  created: HeadlineFlowEventRecord[];
  updated: HeadlineFlowEventRecord[];
  unchanged: HeadlineFlowEventRecord[];
  resolved: HeadlineFlowEventRecord[];
  packageEvents: Array<{
    storyPackageId: string;
    eventId: string;
    eventVersion: number;
    eventStatus: HeadlineFlowEventStatus;
    updateReasons: HeadlineFlowEventUpdateReason[];
    updateSummary: string;
  }>;
  events: HeadlineFlowEventRecord[];
};
