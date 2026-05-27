import { hashPayloadDeterministically } from "@/services/contracts/payloadHasher";
import { serializeDeterministically } from "../normalization/deterministic-serializer";

export function hashReplayInputSnapshot(snapshot: unknown): string {
  return hashPayloadDeterministically(JSON.parse(serializeDeterministically(snapshot)) as unknown);
}
