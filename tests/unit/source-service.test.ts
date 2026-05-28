import { describe, expect, it } from "vitest";
import { AppError } from "@/src/server/api/errors";
import { assertValidSourceUrl } from "@/src/server/services/source-service";

describe("source service validation", () => {
  it("rejects non-http URLs", () => {
    try {
      assertValidSourceUrl("ftp://example.com/feed.xml");
      throw new Error("Expected validation error.");
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect(error).toMatchObject({ code: "invalid_source_url" });
    }
  });

  it("accepts valid http URLs", () => {
    expect(() => assertValidSourceUrl("https://example.com/feed.xml")).not.toThrow();
  });
});
