import { describe, expect, it } from "vitest";
import { getNuruAgentIdentity, listNuruAgentIdentities, nuruAgentIdentitySchema } from "@/src/server/services/nuru-agent-identity-service";

describe("Nuru Agent Identity Model", () => {
  it("gives each V1 specialist an explicit, validated capability profile", () => {
    const identities = listNuruAgentIdentities();
    expect(identities).toHaveLength(5);
    for (const identity of identities) expect(nuruAgentIdentitySchema.parse(identity)).toMatchObject({ status: "ACTIVE", version: "v1" });
    expect(getNuruAgentIdentity("nuru.connection.v1")).toMatchObject({ role: "Connection Agent", permissions: expect.arrayContaining(["READ", "SEARCH", "CONNECT"]), tools: expect.arrayContaining(["search_knowledge", "find_similar", "get_history"]) });
  });

  it("does not resolve unknown agents to an identity", () => {
    expect(getNuruAgentIdentity("nuru.unknown.v1")).toBeUndefined();
  });
});
