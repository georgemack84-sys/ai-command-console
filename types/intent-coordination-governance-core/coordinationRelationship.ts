export type IntentRelationshipType =
  | "dependency"
  | "reference"
  | "approval"
  | "observation"
  | "escalation";

export interface IntentRelationship {
  relationshipId: string;
  parentIntentId: string;
  childIntentId: string;
  relationshipType: IntentRelationshipType;
  governanceBindings: readonly string[];
  replaySafe: true;
  executionAuthority: false;
}
