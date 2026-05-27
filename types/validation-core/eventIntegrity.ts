export type EventIntegrityRecord = Readonly<{
  eventId: string;
  eventHash: string;
  previousEventHash?: string;
  chainHash: string;
  verified: boolean;
}>;
