export type ProposalLineage = Readonly<{
  lineageId: string;
  proposalId: string;
  nodeIds: readonly string[];
  edgeIds: readonly string[];
  proposalHash: string;
  lifecycleHash: string;
  lineageHash: string;
}>;
