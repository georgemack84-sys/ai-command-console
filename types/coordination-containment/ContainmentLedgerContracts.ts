export type ContainmentLedgerAppendInput = Readonly<{
  existing?: import("./ContainmentContracts").ContainmentLedger;
  entry: import("./ContainmentContracts").ContainmentLedgerEntry;
}>;
