import { describe, expect, it } from "vitest";
import { serializeExecutionTreaty } from "@/services/execution-treaty";
import { buildExecutionTreatyFixture } from "./helpers";

describe("execution treaty hash stability", () => {
  it("uses stable treaty hashes and canonical serialization", () => {
    const { treaty } = buildExecutionTreatyFixture();
    const first = serializeExecutionTreaty(treaty);
    const second = serializeExecutionTreaty(treaty);

    expect(first).toBe(second);
    expect(treaty.hashes.treatyHash).toBe(buildExecutionTreatyFixture().treaty.hashes.treatyHash);
  });
});
