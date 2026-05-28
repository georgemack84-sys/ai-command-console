export type ApprovalTimeWindow = Readonly<{
  validFrom: string;
  validUntil: string;
  validAtTimestamp: boolean;
  expired: boolean;
  future: boolean;
  immutableHash: string;
}>;
