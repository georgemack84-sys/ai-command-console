import { canonicalSerialize } from "./canonicalSerializer";

export function diffReplayPayloads(expected: unknown, actual: unknown) {
  return canonicalSerialize(expected) === canonicalSerialize(actual)
    ? null
    : {
        expected: canonicalSerialize(expected),
        actual: canonicalSerialize(actual),
      };
}
