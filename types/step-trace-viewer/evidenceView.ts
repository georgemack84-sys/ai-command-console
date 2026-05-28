export type EvidenceNavigatorItem = Readonly<{
  eventId: string;
  evidenceHash?: string;
  evidenceType: string;
  sourceHash?: string;
  validationEventId: string;
  treatyReference?: string;
  missing: boolean;
}>;

export type EvidenceNavigatorView = Readonly<{
  items: readonly EvidenceNavigatorItem[];
  missingEvidenceCount: number;
  projectionHash: string;
}>;
