import { describe, expect, it, vi } from "vitest";
import { AppError } from "@/src/server/api/errors";
import { assertValidSourceUrl } from "@/src/server/services/source-service";

vi.mock("@/src/config/env", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/src/config/env")>()),
  sourceAllowsPrivateUrls: () => false,
}));

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

  it("does not treat ordinary hostnames as IPv6 private ranges", () => {
    expect(() => assertValidSourceUrl("https://fc-news.example.com/feed.xml")).not.toThrow();
  });

  it.each([
    "http://localhost/feed.xml",
    "http://127.0.0.1/feed.xml",
    "http://10.0.0.5/feed.xml",
    "http://172.16.0.5/feed.xml",
    "http://192.168.1.10/feed.xml",
    "http://169.254.169.254/latest/meta-data/",
    "http://[::1]/feed.xml",
    "http://[::ffff:192.168.1.10]/feed.xml",
  ])("rejects private or local source URLs: %s", (url) => {
    try {
      assertValidSourceUrl(url);
      throw new Error("Expected validation error.");
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect(error).toMatchObject({ code: "invalid_source_url" });
    }
  });
});
