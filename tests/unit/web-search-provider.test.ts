import { describe, expect, it } from "vitest";
import { WebSearchNewsProvider } from "@/lib/news/providers/WebSearchNewsProvider";

describe("WebSearchNewsProvider", () => {
  it("is available without credentials", async () => {
    const provider = new WebSearchNewsProvider();
    expect(provider.isConfigured()).toBe(true);
    expect((await provider.health()).status).toBe("ok");
  });
});
