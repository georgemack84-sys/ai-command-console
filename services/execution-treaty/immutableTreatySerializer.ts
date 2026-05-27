import { serializeDeterministically } from "@/services/planning/normalization/deterministic-serializer";

export function serializeExecutionTreaty(value: unknown): string {
  return serializeDeterministically(value).normalize("NFC");
}
