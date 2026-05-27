import type { GovernanceFailure, GovernanceLineageNode } from "./governanceTypes";
import { hashGovernanceLineageNode } from "./governanceHashing";

export function buildGovernanceLineageRoot(input: {
  governanceHash: string;
  toolId: string;
  toolVersion: string;
}): GovernanceLineageNode {
  const node = {
    governanceHash: input.governanceHash,
    generation: 0,
    parentHash: null,
    toolId: input.toolId,
    toolVersion: input.toolVersion,
  } as const;

  return {
    ...node,
    lineageHash: hashGovernanceLineageNode(node),
  };
}

export function buildGovernanceLineageChild(input: {
  parent: GovernanceLineageNode;
  governanceHash: string;
  toolId: string;
  toolVersion: string;
}): GovernanceLineageNode {
  const node = {
    governanceHash: input.governanceHash,
    generation: input.parent.generation + 1,
    parentHash: input.parent.lineageHash,
    toolId: input.toolId,
    toolVersion: input.toolVersion,
  } as const;

  return {
    ...node,
    lineageHash: hashGovernanceLineageNode(node),
  };
}

export function validateGovernanceLineage(nodes: readonly GovernanceLineageNode[]): readonly GovernanceFailure[] {
  const failures: GovernanceFailure[] = [];
  if (!nodes.length) {
    return failures;
  }

  const [root, ...rest] = nodes;
  if (root.generation !== 0 || root.parentHash !== null) {
    failures.push({
      code: "TOOL_GOVERNANCE_LINEAGE_INVALID",
      message: "governance lineage root is invalid",
    });
  }

  const expectedRootHash = hashGovernanceLineageNode({
    governanceHash: root.governanceHash,
    generation: root.generation,
    parentHash: root.parentHash,
    toolId: root.toolId,
    toolVersion: root.toolVersion,
  });
  if (expectedRootHash !== root.lineageHash) {
    failures.push({
      code: "TOOL_GOVERNANCE_LINEAGE_INVALID",
      message: "governance lineage root hash mismatch",
    });
  }

  let previous = root;
  for (const node of rest) {
    if (node.parentHash !== previous.lineageHash || node.generation !== previous.generation + 1) {
      failures.push({
        code: "TOOL_GOVERNANCE_LINEAGE_INVALID",
        message: "governance lineage continuity mismatch",
      });
    }
    const expectedHash = hashGovernanceLineageNode({
      governanceHash: node.governanceHash,
      generation: node.generation,
      parentHash: node.parentHash,
      toolId: node.toolId,
      toolVersion: node.toolVersion,
    });
    if (expectedHash !== node.lineageHash) {
      failures.push({
        code: "TOOL_GOVERNANCE_LINEAGE_INVALID",
        message: "governance lineage node hash mismatch",
      });
    }
    previous = node;
  }

  return failures;
}
